export interface MeasureUpdateData {
    customerCode?: string;
    measureDatetime?: string;
    measureType?: 'WATER' | 'GAS';
    imageUrl?: string;
    measureValue?: number;
    hasConfirmed?: boolean;
}