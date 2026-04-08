<?php

namespace App\Support\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait UsesCaseInsensitiveLike
{
    private function caseInsensitiveLikeOperator(Builder $query): string
    {
        return $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }

    private function containsPattern(string $term): string
    {
        return '%' . trim($term) . '%';
    }
}
