
import React from 'react';
import { BudgetCard } from './BudgetCard';
import { formatCurrency } from '@/utils/budget';

interface ActualSpendCardProps {
  totalActualSpent: number;
  percentageSpent: number;
}

export function ActualSpendCard({ totalActualSpent, percentageSpent }: ActualSpendCardProps) {
  return (
    <BudgetCard 
      title="Budget Réel Dépensé"
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M2 10h20" />
        </svg>
      }
    >
      <div className="text-2xl font-bold">{formatCurrency(totalActualSpent)}</div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
        <div className={`h-1.5 rounded-full ${percentageSpent < 90 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{
          width: `${Math.min(percentageSpent, 100)}%`
        }} />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {percentageSpent.toFixed(1)}% du budget total prévu
      </p>
    </BudgetCard>
  );
}
