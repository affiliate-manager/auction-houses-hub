<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LotResource\Pages;
use App\Models\Lot;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Filters\SelectFilter;

class LotResource extends Resource
{
    protected static ?string $model = Lot::class;

    protected static ?string $navigationIcon = 'heroicon-o-home-modern';

    protected static ?string $navigationLabel = 'Lots';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Property Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('title')
                            ->required()
                            ->maxLength(500)
                            ->columnSpanFull(),
                        Forms\Components\TextInput::make('address')
                            ->maxLength(500),
                        Forms\Components\TextInput::make('postcode')
                            ->maxLength(10),
                        Forms\Components\Select::make('region')
                            ->options([
                                'London' => 'London',
                                'South East' => 'South East',
                                'South West' => 'South West',
                                'East Anglia' => 'East Anglia',
                                'East Midlands' => 'East Midlands',
                                'West Midlands' => 'West Midlands',
                                'North West' => 'North West',
                                'North East' => 'North East',
                                'Yorkshire' => 'Yorkshire',
                                'Wales' => 'Wales',
                                'Scotland' => 'Scotland',
                            ])
                            ->searchable(),
                        Forms\Components\Select::make('property_type')
                            ->options([
                                'residential' => 'Residential',
                                'commercial' => 'Commercial',
                                'land' => 'Land',
                                'mixed' => 'Mixed Use',
                            ])
                            ->required(),
                        Forms\Components\Select::make('lot_condition')
                            ->options([
                                'modern' => 'Modern',
                                'refurbishment' => 'Refurbishment',
                                'development' => 'Development',
                                'mixed' => 'Mixed',
                            ]),
                        Forms\Components\TextInput::make('bedrooms')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(20),
                    ]),

                Forms\Components\Section::make('Auction Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('auction_house_id')
                            ->label('Auction House ID')
                            ->numeric()
                            ->required()
                            ->helperText('ID from the directory (1-100)'),
                        Forms\Components\TextInput::make('lot_number')
                            ->numeric(),
                        Forms\Components\DatePicker::make('auction_date')
                            ->required(),
                        Forms\Components\Select::make('status')
                            ->options([
                                'upcoming' => 'Upcoming',
                                'live' => 'Live',
                                'sold' => 'Sold',
                                'withdrawn' => 'Withdrawn',
                                'unsold' => 'Unsold',
                            ])
                            ->default('upcoming')
                            ->required(),
                    ]),

                Forms\Components\Section::make('Pricing')
                    ->columns(3)
                    ->schema([
                        Forms\Components\TextInput::make('guide_price_low')
                            ->label('Guide Price (Low)')
                            ->numeric()
                            ->prefix('£'),
                        Forms\Components\TextInput::make('guide_price_high')
                            ->label('Guide Price (High)')
                            ->numeric()
                            ->prefix('£'),
                        Forms\Components\TextInput::make('sale_price')
                            ->label('Sale Price')
                            ->numeric()
                            ->prefix('£'),
                    ]),

                Forms\Components\Section::make('Media & Links')
                    ->schema([
                        Forms\Components\TextInput::make('external_url')
                            ->label('External URL')
                            ->url()
                            ->maxLength(500),
                        Forms\Components\TextInput::make('image_url')
                            ->label('Image URL')
                            ->url()
                            ->maxLength(500),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable()
                    ->width('60px'),
                Tables\Columns\TextColumn::make('title')
                    ->limit(40)
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('region')
                    ->badge()
                    ->sortable(),
                Tables\Columns\TextColumn::make('property_type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'residential' => 'success',
                        'commercial' => 'info',
                        'land' => 'warning',
                        'mixed' => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('guide_price_low')
                    ->label('Guide Price')
                    ->money('GBP')
                    ->sortable(),
                Tables\Columns\TextColumn::make('auction_date')
                    ->date('d M Y')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'upcoming' => 'info',
                        'live' => 'success',
                        'sold' => 'gray',
                        'withdrawn' => 'danger',
                        'unsold' => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('auction_house_id')
                    ->label('House ID')
                    ->sortable(),
            ])
            ->defaultSort('auction_date', 'asc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'upcoming' => 'Upcoming',
                        'live' => 'Live',
                        'sold' => 'Sold',
                        'withdrawn' => 'Withdrawn',
                        'unsold' => 'Unsold',
                    ]),
                SelectFilter::make('property_type')
                    ->options([
                        'residential' => 'Residential',
                        'commercial' => 'Commercial',
                        'land' => 'Land',
                        'mixed' => 'Mixed',
                    ]),
                SelectFilter::make('region')
                    ->options([
                        'London' => 'London',
                        'South East' => 'South East',
                        'South West' => 'South West',
                        'East Anglia' => 'East Anglia',
                        'East Midlands' => 'East Midlands',
                        'West Midlands' => 'West Midlands',
                        'North West' => 'North West',
                        'North East' => 'North East',
                        'Yorkshire' => 'Yorkshire',
                        'Wales' => 'Wales',
                        'Scotland' => 'Scotland',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\BulkAction::make('mark_sold')
                        ->label('Mark as Sold')
                        ->icon('heroicon-o-check-circle')
                        ->requiresConfirmation()
                        ->action(fn ($records) => $records->each->update(['status' => 'sold'])),
                    Tables\Actions\BulkAction::make('mark_withdrawn')
                        ->label('Mark as Withdrawn')
                        ->icon('heroicon-o-x-circle')
                        ->requiresConfirmation()
                        ->action(fn ($records) => $records->each->update(['status' => 'withdrawn'])),
                ]),
            ])
            ->headerActions([
                Tables\Actions\Action::make('import_csv')
                    ->label('Import CSV')
                    ->icon('heroicon-o-arrow-up-tray')
                    ->form([
                        Forms\Components\FileUpload::make('csv_file')
                            ->label('CSV File')
                            ->acceptedFileTypes(['text/csv', 'application/vnd.ms-excel'])
                            ->required(),
                    ])
                    ->action(function (array $data) {
                        // CSV import logic
                        $path = storage_path('app/public/' . $data['csv_file']);
                        if (!file_exists($path)) return;

                        $handle = fopen($path, 'r');
                        $header = fgetcsv($handle);
                        $imported = 0;

                        while (($row = fgetcsv($handle)) !== false) {
                            $record = array_combine($header, $row);
                            Lot::create([
                                'auction_house_id' => $record['auction_house_id'] ?? 0,
                                'title' => $record['title'] ?? 'Untitled',
                                'address' => $record['address'] ?? null,
                                'postcode' => $record['postcode'] ?? null,
                                'region' => $record['region'] ?? null,
                                'property_type' => $record['property_type'] ?? 'residential',
                                'lot_condition' => $record['lot_condition'] ?? 'mixed',
                                'bedrooms' => $record['bedrooms'] ?? null,
                                'guide_price_low' => $record['guide_price_low'] ?? null,
                                'guide_price_high' => $record['guide_price_high'] ?? null,
                                'auction_date' => $record['auction_date'] ?? null,
                                'lot_number' => $record['lot_number'] ?? null,
                                'status' => 'upcoming',
                            ]);
                            $imported++;
                        }

                        fclose($handle);

                        \Filament\Notifications\Notification::make()
                            ->title("Imported {$imported} lots")
                            ->success()
                            ->send();
                    }),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListLots::route('/'),
            'create' => Pages\CreateLot::route('/create'),
            'edit' => Pages\EditLot::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'upcoming')->count();
    }
}
