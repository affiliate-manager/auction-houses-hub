<?php

namespace App\Services\Enrichment;

use App\Models\Lot;
use App\Models\LotEnrichment;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class LandRegistryEnricher
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'base_uri' => 'https://landregistry.data.gov.uk/',
            'timeout' => 15,
            'connect_timeout' => 5,
            'headers' => ['Accept' => 'application/json'],
        ]);
    }

    public function enrich(Lot $lot, LotEnrichment $enrichment): array
    {
        $errors = [];
        $postcode = trim($lot->postcode ?? '');

        if (empty($postcode)) {
            return ['land_registry' => 'No postcode available'];
        }

        try {
            $sparql = $this->buildSparqlQuery($postcode);
            $response = $this->http->get('app/root/qonsole', [
                'query' => ['query' => $sparql],
                'headers' => ['Accept' => 'application/json'],
            ]);

            $statusCode = $response->getStatusCode();
            if ($statusCode !== 200) {
                return $this->fallbackJsonApi($lot, $enrichment, $postcode);
            }

            $data = json_decode((string) $response->getBody(), true);
            if (empty($data['results']['bindings'])) {
                return $this->fallbackJsonApi($lot, $enrichment, $postcode);
            }

            $transactions = [];
            foreach ($data['results']['bindings'] as $row) {
                $transactions[] = [
                    'price' => (int) ($row['amount']['value'] ?? 0),
                    'date' => $row['date']['value'] ?? null,
                    'address' => $row['paon']['value'] ?? '',
                    'type' => $row['type']['value'] ?? '',
                ];
            }

            $this->processTransactions($enrichment, $transactions);
            Log::info("[Enrichment:LandReg] {$postcode}: " . count($transactions) . " transactions, avg £{$enrichment->land_reg_avg_price}");
        } catch (\Exception $e) {
            try {
                $errors = $this->fallbackJsonApi($lot, $enrichment, $postcode);
            } catch (\Exception $e2) {
                $errors['land_registry'] = $e2->getMessage();
                Log::warning("[Enrichment:LandReg] Failed for {$postcode}: " . $e2->getMessage());
            }
        }

        return $errors;
    }

    private function fallbackJsonApi(Lot $lot, LotEnrichment $enrichment, string $postcode): array
    {
        $errors = [];

        try {
            $encoded = urlencode($postcode);
            $response = $this->http->get("data/ppi/transaction-record.json?propertyAddress.postcode={$encoded}&_pageSize=30&_sort=-transactionDate");
            $data = json_decode((string) $response->getBody(), true);
            $items = $data['result']['items'] ?? [];

            if (empty($items)) {
                return ['land_registry' => 'No transactions found for this postcode'];
            }

            $transactions = [];
            foreach ($items as $item) {
                $transactions[] = [
                    'price' => (int) ($item['pricePaid'] ?? 0),
                    'date' => $item['transactionDate'] ?? null,
                    'address' => ($item['propertyAddress']['paon'] ?? '') . ' ' . ($item['propertyAddress']['street'] ?? ''),
                    'type' => $item['propertyAddress']['propertyType'] ?? '',
                ];
            }

            $this->processTransactions($enrichment, $transactions);
            Log::info("[Enrichment:LandReg-Fallback] {$postcode}: " . count($transactions) . " transactions");
        } catch (\Exception $e) {
            $errors['land_registry'] = $e->getMessage();
            Log::warning("[Enrichment:LandReg-Fallback] Failed: " . $e->getMessage());
        }

        return $errors;
    }

    private function processTransactions(LotEnrichment $enrichment, array $transactions): void
    {
        if (empty($transactions)) return;

        $prices = array_filter(array_column($transactions, 'price'));
        if (empty($prices)) return;

        $enrichment->land_reg_avg_price = (int) round(array_sum($prices) / count($prices));

        usort($transactions, fn($a, $b) => ($b['date'] ?? '') <=> ($a['date'] ?? ''));
        $latest = $transactions[0];
        $enrichment->land_reg_last_sale_price = $latest['price'];
        $enrichment->land_reg_last_sale_date = $latest['date'] ? substr($latest['date'], 0, 10) : null;
        $enrichment->land_reg_transactions_json = array_slice($transactions, 0, 20);
    }

    private function buildSparqlQuery(string $postcode): string
    {
        $pc = addslashes(strtoupper(trim($postcode)));
        return <<<SPARQL
PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

SELECT ?paon ?saon ?street ?amount ?date ?type
WHERE {
  ?tranx lrppi:pricePaid ?amount ;
         lrppi:transactionDate ?date ;
         lrppi:propertyAddress ?addr .
  ?addr lrcommon:postcode "{$pc}" .
  OPTIONAL { ?addr lrcommon:paon ?paon }
  OPTIONAL { ?addr lrcommon:saon ?saon }
  OPTIONAL { ?addr lrcommon:street ?street }
  OPTIONAL { ?addr lrcommon:propertyType ?type }
}
ORDER BY DESC(?date)
LIMIT 30
SPARQL;
    }
}
