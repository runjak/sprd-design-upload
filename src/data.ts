import compareDest from 'date-fns/compareDesc';
import uniqBy from 'lodash/uniqBy';

import {
  CurrenciesData,
  Idea,
  Ideas,
  PointOfSale,
  PointsOfSale,
  Assortment,
  IdeaTranslation,
  PointOfSaleType,
} from './types';
import { shopUrl } from './consts';

export function findIdForIsoCodeInCurrenciesData(currenciesData: CurrenciesData, wantedIsoCode: string = 'EUR'): string | null {
  const { currencies } = currenciesData;

  const [currency] = currencies.filter(({isoCode}) => isoCode === wantedIsoCode);

  return currency ? currency.id : null;
}

export function newestIdea(ideas: Ideas): Idea | null {
  return ideas.list.reduce(
    (last: Idea | null, next: Idea) => {
      if (last === null) {
        return next;
      }

      const cmp = compareDest(
        new Date(last.dateCreated),
        new Date(next.dateCreated),
      );

      return (cmp < 0) ? last : next;
    },
    null,
  );
}

export function setCommission(idea: Idea, amount: number): Idea {
  return {
    ...idea,
    commission: {
      amount,
      currencyId: '1',
    },
  };
}

export function setPublishingDetails(idea: Idea, pointsOfSale: Array<PointOfSale>): Idea {
  return {
    ...idea,
    publishingDetails: pointsOfSale.map((pointOfSale) => ({
      pointOfSale: {
        ...pointOfSale,
        allowed: true,
      }
    })),
  };
}

export function filterPointsOfSaleByType(pointsOfSale: PointsOfSale, filterType: PointOfSaleType): Array<PointOfSale> {
  return pointsOfSale.list.filter(({type}) => (type === filterType));
}

export function setAssortment(idea: Idea, assortment: Assortment): Idea {
  return {
    ...idea,
    assortment,
  };
}

export function setTranslation(idea: Idea, translation: IdeaTranslation): Idea {
  return {
    ...idea,
    translations: uniqBy(
      [translation, ...idea.translations],
      ({locale}) => (locale),
    ),
  };
}

export function designUrlForIdea(idea: Idea, productTypeId: string = '812'): string {
  const pointsOfSale = (idea.publishingDetails || []).map(p => p.pointOfSale);
  const [shopName = ''] = pointsOfSale.filter(({type}) => (type === 'SHOP')).map(p => p.name);

  return `${shopUrl}/${shopName}/create?design=${idea.mainDesignId}&productType=${productTypeId}`;
}
