import { SeededRNG } from '../utils/seedRandom';
import { ResourceType, type MarketItem, type StationData, FactionId } from '../core/types';
import { RESOURCES } from '../data/resources';
import { FACTIONS } from '../data/factions';

export function generateMarket(rng: SeededRNG, station: StationData): MarketItem[] {
  const items: MarketItem[] = [];
  const faction = FACTIONS[station.faction];

  // Base modifiers by faction
  const factionModifiers: Record<FactionId, Partial<Record<ResourceType, { supply: number; demand: number }>>> = {
    [FactionId.HumanFederation]: {
      [ResourceType.Fuel]: { supply: 0.8, demand: 0.5 },
      [ResourceType.Minerals]: { supply: 0.6, demand: 0.6 },
      [ResourceType.Organics]: { supply: 0.5, demand: 0.7 },
    },
    [FactionId.IndependentTraders]: {
      [ResourceType.Exotic]: { supply: 0.7, demand: 0.8 },
      [ResourceType.TechSalvage]: { supply: 0.6, demand: 0.9 },
      [ResourceType.Fuel]: { supply: 0.9, demand: 0.6 },
    },
    [FactionId.MilitaryEmpire]: {
      [ResourceType.Minerals]: { supply: 0.9, demand: 0.4 },
      [ResourceType.Fuel]: { supply: 0.8, demand: 0.7 },
      [ResourceType.TechSalvage]: { supply: 0.4, demand: 0.8 },
    },
    [FactionId.ScientificCoalition]: {
      [ResourceType.Organics]: { supply: 0.6, demand: 0.9 },
      [ResourceType.Exotic]: { supply: 0.5, demand: 0.9 },
      [ResourceType.TechSalvage]: { supply: 0.8, demand: 0.6 },
      [ResourceType.Water]: { supply: 0.7, demand: 0.5 },
    },
    [FactionId.Nomadic]: {
      [ResourceType.Water]: { supply: 0.9, demand: 0.3 },
      [ResourceType.Fuel]: { supply: 0.6, demand: 0.8 },
      [ResourceType.Organics]: { supply: 0.8, demand: 0.4 },
    },
    [FactionId.Ancient]: {
      [ResourceType.Exotic]: { supply: 1.0, demand: 0.2 },
      [ResourceType.TechSalvage]: { supply: 1.0, demand: 0.1 },
    },
  };

  const wealth = station.wealth ?? rng.range(0.3, 0.9);
  const stationTypeMod = station.type === 'colony' ? 1.2 : station.type === 'outpost' ? 0.7 : 1.0;

  for (const resType of Object.values(ResourceType)) {
    const baseDef = RESOURCES[resType];
    const factionMod = factionModifiers[station.faction]?.[resType];

    let supply = factionMod?.supply ?? rng.range(0.3, 0.8);
    let demand = factionMod?.demand ?? rng.range(0.3, 0.8);

    // Wealth affects supply
    supply = Math.min(1, supply * (0.5 + wealth));
    // Random fluctuation
    supply = Math.max(0.1, Math.min(1, supply + rng.range(-0.2, 0.2)));
    demand = Math.max(0.1, Math.min(1, demand + rng.range(-0.2, 0.2)));

    // Price calculation: base value * (demand/supply) * wealth * type mod
    const basePrice = baseDef.value * 10; // credits
    const sellPrice = Math.floor(basePrice * (demand / Math.max(0.2, supply)) * (0.8 + wealth * 0.4) * stationTypeMod * rng.range(0.9, 1.1));
    const buyPrice = Math.floor(sellPrice * rng.range(0.5, 0.8)); // station buys cheaper

    const stock = Math.floor(rng.range(20, 200) * supply * stationTypeMod * (resType === ResourceType.Fuel ? 3 : 1));

    items.push({
      resource: resType,
      buyPrice,
      sellPrice,
      supply,
      demand,
      stock,
    });
  }

  return items;
}

export class MarketManager {
  // Simulate price fluctuations over time
  static updateMarket(market: MarketItem[], rng: SeededRNG, deltaDays: number = 1): MarketItem[] {
    return market.map(item => {
      // Small random walk
      const supplyChange = rng.range(-0.05, 0.05) * deltaDays;
      const demandChange = rng.range(-0.05, 0.05) * deltaDays;

      const newSupply = Math.max(0.1, Math.min(1, item.supply + supplyChange));
      const newDemand = Math.max(0.1, Math.min(1, item.demand + demandChange));

      const baseDef = RESOURCES[item.resource];
      const basePrice = baseDef.value * 10;
      const newSell = Math.floor(basePrice * (newDemand / Math.max(0.2, newSupply)) * rng.range(0.9, 1.1));
      const newBuy = Math.floor(newSell * 0.65);

      return {
        ...item,
        supply: newSupply,
        demand: newDemand,
        sellPrice: newSell,
        buyPrice: newBuy,
        stock: Math.max(0, item.stock + Math.floor(rng.range(-10, 20))),
      };
    });
  }

  static getTradePrice(item: MarketItem, isBuying: boolean, reputation: number, quantity: number): number {
    // Reputation affects price: friendly = better prices
    const repModifier = 1 - (reputation / 100) * 0.2; // -20% to +20%
    const base = isBuying ? item.sellPrice : item.buyPrice;
    // Bulk discount/premium
    const bulkMod = quantity > 50 ? 0.95 : quantity > 20 ? 0.98 : 1.0;
    return Math.floor(base * repModifier * bulkMod);
  }
}
