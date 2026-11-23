/**
 * Verifica che i modelli riproducano i valori numerici riportati nelle due tesi.
 * Uso: npm test
 */
import { rearShareAtLimit, stoppingDistance, stoppieLimit } from '../src/physics/braking';
import { aquaplaningSpeed, criticalWaterDepth, normFl } from '../src/physics/friction';
import { curveSightDistance, headlightReachInCurve, crestSightDistance } from '../src/physics/visibility';
import { leanAngle } from '../src/physics/cornering';
import { rutProbability } from '../src/physics/rutting';
import { tangentExit } from '../src/physics/impact';
import { kmh, deg } from '../src/physics/units';

let fail = 0;
function check(name: string, got: number, expected: number, tol: number) {
  const ok = Math.abs(got - expected) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: ${got.toFixed(3)} (atteso ${expected} ± ${tol})`);
}

// Tav. 02: quota del posteriore nella frenata ottimale
check('Tav.02 quota posteriore μ=0.30', rearShareAtLimit(0.3), 0.35, 0.005);
check('Tav.02 quota posteriore μ=0.85', rearShareAtLimit(0.85), 0.075, 0.01);
check('Ribaltamento in avanti [g] (h=0.7, p=1.4, b=0.7)', stoppieLimit(), 1.0, 1e-9);
// Fig. IV.2: innesco aquaplaning con battistrada
check('Fig.IV.2 V aquaplaning 12 mm', aquaplaningSpeed(12), 80, 1);
check('Fig.IV.2 V aquaplaning 7 mm', aquaplaningSpeed(7), 95, 1);
check('h_crit a 110 km/h [mm]', criticalWaterDepth(110), 4.1, 0.1);
// Fig. III.6: spazio di frenatura a 70 km/h con f di norma
const f70 = normFl(70);
check('f_l di norma a 70 km/h', f70, 0.325, 0.001);
check('Fig.III.6 d_a a 70 km/h, aderenza integra [m]', stoppingDistance({ v: kmh(70), tau: 0, f: f70 }).total, 59.3, 0.5);
check('Fig.III.6 d_a a 70 km/h, aderenza −60% [m]', stoppingDistance({ v: kmh(70), tau: 0, f: f70 * 0.4 }).total, 148.3, 0.5);
// Visuali libere (scenari E-01, A-01, E-04, E-14)
check('E-01 D auto (R=120, m=2.75)', curveSightDistance(120, 2.75), 51.5, 0.3);
check('E-01 D moto (R=120, m=2.0)', curveSightDistance(120, 2.0), 43.9, 0.3);
check('E-01 arresto 70 km/h τ=1 0.6g', stoppingDistance({ v: kmh(70), tau: 1, f: 0.6 }).total, 51.6, 0.3);
check('A-01 D (R=800, m=2)', curveSightDistance(800, 2), 113, 0.5);
check('A-01 arresto 130 km/h τ=1 0.7g', stoppingDistance({ v: kmh(130), tau: 1, f: 0.7 }).total, 131, 0.5);
check('E-04 D dosso (Rv=600, 1.3 m, 1.4 m)', crestSightDistance(600, 1.3, 1.4), 80.5, 0.5);
check('E-14 portata faro (R=100, e=1.75)', headlightReachInCurve(100, 1.75), 18.8, 0.1);
// Piega (E-02, E-05)
check('E-02 piega 90 km/h R=80 [°]', deg(leanAngle(kmh(90), 80)), 38.5, 0.2);
check('E-05 piega 60 km/h R=60 [°]', deg(leanAngle(kmh(60), 60)), 25.2, 0.2);
// Ormaie (E-08)
const rut = rutProbability({ hMm: 15, b: 0.4, vKmh: 80, sigma: 0.25 });
check('E-08 x_crit [m]', rut.xCrit, 0.179, 0.003);
check('E-08 P_h,l', rut.P, 0.526, 0.01);
// Uscita per la tangente (E-05)
const ex = tangentExit(60, 2.5);
check('E-05 lunghezza tangente [m]', ex.length, 17.5, 0.1);
check('E-05 angolo d’impatto [°]', deg(ex.theta), 16.3, 0.2);

if (fail) {
  console.error(`\n${fail} verifiche non superate`);
  process.exit(1);
}
console.log('\nTutte le verifiche superate');
