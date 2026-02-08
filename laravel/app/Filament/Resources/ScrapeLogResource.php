<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ScrapeLogResource\Pages;
use App\Models\ScrapeLog;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;

class ScrapeLogResource extends Resource
{
    protected static ?string $model = ScrapeLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-arrow-path';

    protected static ?string $navigationLabel = 'Scrape Logs';

    protected static ?int $navigationSort = 2;

    protected static ?string $navigationGroup = 'Data Pipeline';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('auction_house_id')
                    ->label('Auction House ID')
                    ->numeric()
                    ->required(),
                Forms\Components\Select::make('status')
                    ->options([
                        'success' => 'Success',
                        'partial' => 'Partial',
                        'failed' => 'Failed',
                    ])
                    ->required(),
                Forms\Components\TextInput::make('lots_found')
                    ->numeric()
                    ->default(0),
                Forms\Components\TextInput::make('lots_new')
                    ->numeric()
                    ->default(0),
                Forms\Components\TextInput::make('duration_ms')
                    ->label('Duration (ms)')
                    ->numeric(),
                Forms\Components\Textarea::make('error_message')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable(),
                Tables\Columns\TextColumn::make('auction_house_id')
                    ->label('House ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'success' => 'success',
                        'partial' => 'warning',
                        'failed' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('lots_found')
                    ->label('Found')
                    ->sortable(),
                Tables\Columns\TextColumn::make('lots_new')
                    ->label('New')
                    ->sortable(),
                Tables\Columns\TextColumn::make('duration_ms')
                    ->label('Duration')
                    ->formatStateUsing(fn ($state) => $state ? number_format($state) . 'ms' : '-')
                    ->sortable(),
                Tables\Columns\TextColumn::make('error_message')
                    ->limit(50)
                    ->tooltip(fn ($record) => $record->error_message),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('d M Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'success' => 'Success',
                        'partial' => 'Partial',
                        'failed' => 'Failed',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListScrapeLogs::route('/'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        $failed = static::getModel()::where('status', 'failed')
            ->where('created_at', '>=', now()->subDay())
            ->count();

        return $failed > 0 ? (string) $failed : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }
}
