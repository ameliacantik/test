import { SHIP } from '../core/constants';
import type { ShipState } from '../core/types';
import { dist } from '../utils/math';
import type { StarData } from '../core/types';

export interface FTLResult {
  success: boolean;
  fuelCost: number;
  riskEvent?: string;
  arrivalDeviation?: number;
  message: string;
}

export function calculateFTLCost(from: { x: number; y: number }, to: { x: number; y: number }, ship: ShipState): number {
  const distance = dist(from, to);
  const baseCost = distance * (SHIP.FTL_FUEL_COST_PER_LY / 100); // scale down
  // efficiency from modules
  const engineMod = ship.modules.find(m => m.type === 'engine');
  const efficiency = engineMod ? 1 - (engineMod.level - 1) * 0.05 : 1;
  return Math.max(5, baseCost * efficiency);
}

export function canFTLJump(ship: ShipState, target: StarData): { can: boolean; reason?: string } {
  const distance = dist(ship.position, target.position);
  if (distance > ship.ftlRange) {
    return { can: false, reason: `Target beyond FTL range (${distance.toFixed(0)} > ${ship.ftlRange.toFixed(0)})` };
  }
  const cost = calculateFTLCost(ship.position, target.position, ship);
  if (ship.fuel < cost) {
    return { can: false, reason: `Insufficient fuel (${ship.fuel.toFixed(0)} < ${cost.toFixed(0)})` };
  }
  if (ship.ftlCharge < 10) {
    return { can: false, reason: 'FTL drive not charged' };
  }
  if (ship.modules.find(m => m.type === 'navigation')?.health! < 20) {
    return { can: false, reason: 'Navigation system critically damaged' };
  }
  return { can: true };
}

export function executeFTLJump(
  ship: ShipState,
  from: StarData | null,
  to: StarData,
  rng: () => number
): FTLResult {
  const distance = dist(ship.position, to.position);
  const fuelCost = calculateFTLCost(ship.position, to.position, ship);

  // Risk calculation
  const danger = to.dangerLevel;
  const navHealth = ship.modules.find(m => m.type === 'navigation')?.health || 100;
  const engineHealth = ship.modules.find(m => m.type === 'engine')?.health || 100;

  const baseRisk = danger * 0.3 + (1 - navHealth / 100) * 0.3 + (1 - engineHealth / 100) * 0.2;
  const roll = rng();

  let riskEvent: string | undefined;
  let deviation = 0;
  let message = `FTL jump to ${to.name} successful.`;

  if (roll < baseRisk * 0.2) {
    // Critical failure
    riskEvent = 'jump_failure';
    message = `FTL jump destabilized! Emergency dropout ${ (distance * 0.3).toFixed(0)} LY off target. Hull stress detected.`;
    deviation = distance * 0.3 * rng();
    // damage
    ship.hull = Math.max(0, ship.hull - 50 - rng() * 100);
    ship.ftlCharge = 0;
  } else if (roll < baseRisk) {
    // Minor anomaly
    const anomalies = [
      'navigation_error',
      'sensor_ghost',
      'temporal_echo',
      'unknown_signal',
    ];
    riskEvent = anomalies[Math.floor(rng() * anomalies.length)];
    message = `Jump completed with anomaly: ${riskEvent.replace('_', ' ')}. Sensors detecting residual energy.`;
    deviation = distance * 0.05 * rng();
  }

  return {
    success: !riskEvent || riskEvent !== 'jump_failure',
    fuelCost,
    riskEvent,
    arrivalDeviation: deviation,
    message,
  };
}
