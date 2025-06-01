export interface Currency {
  code: string
  symbol: string
  name: string
}

export const CURRENCIES: Currency[] = [
  {
    code: 'RUB',
    symbol: '₽',
    name: 'Российский рубль'
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'Доллар США'
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Евро'
  }
] 