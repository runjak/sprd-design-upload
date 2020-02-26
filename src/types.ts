export interface AuthData {
  username: string,
  password: string,
  apiKey: string,
  apiSecret: string,
};

export interface Session {
  id: string,
  user: {
    id: string,
  },
};

export interface Currency {
  id: string,
  isoCode: string,
};

export interface CurrenciesData {
  currencies: Array<Currency>,
};

export interface Commission {
  amount: number,
  currencyId: string,
};

export type PointOfSaleType = 'SHOP' | 'CYO' | 'MARKETPLACE';

export interface PointOfSale {
  id: string,
  name?: string,
  type: PointOfSaleType,
  target: {
    id: string,
    currencyId?: string,
  }
};

export interface PointsOfSale {
  list: Array<PointOfSale>,
};

export interface PublishedPointOfSale extends PointOfSale {
  allowed: boolean,
};

export interface LegalState {
  pointOfSaleType: PointOfSaleType,
  publishingAllowed: boolean,
}

export interface Appearance {
  appearanceId: string,
  localizedName: string,
  rgbs: Array<string>,
  metaColors: Array<{metaColor: string, distance: number}>,
  designContrast: 'LOW' | 'MEDIUM' | string,
  excluded: boolean,
};

export interface PrimarySellable {
  id: string,
  productType: string,
  productTypeName: string,
  vpKey: string,
  defaultImageUrl: string,
  productTypeImageUrl: string,
  assortmentGroupIds: Array<string>,
  weight: number,
  colors: Array<Appearance>
};

export interface Assortment {
  filterId: string,
  name: string,
  shortName?: string,
  included: boolean,
  available: boolean,
  primarySellable?: PrimarySellable,
  assortmentSize?: number,
  subFilters: {
    [key: string]: Assortment,
  },
};

export interface IdeaTranslation {
  name: string,
  tags: Array<string>,
  locale: string,
  autotranslated: boolean,
  description?: string,
};

export interface IdeaResource {
  type: 'default' | 'list-preview' | string,
  href: string,
};

export interface Idea {
  id: string,
  href: string,
  dateCreated: string,
  dateModified: string | number,
  userId: string,
  state: 'ACTIVE' | string,
  mainDesignId?: string,
  processingState: 'NEW' | string,
  legalStates: Array<LegalState>,
  commission?: Commission,
  publishingDetails?: Array<{
    pointOfSale: PublishedPointOfSale,
  }>,
  assortment?: Assortment,
  properties?: {
    configuration: string,
  },
  translations: Array<IdeaTranslation>,
  flags: Array<string>,
  resources?: Array<IdeaResource>,
  shopCollectionIds: Array<string>,
};

export interface Ideas {
  list: Array<Idea>,
};

export interface ApiError {
  errorCode: string,
  message: string,
  errorId: string,
  additional: object,
};
