import { GetUnitsData } from "./data-access";
import { ConvertUnits } from "./helpers";
import { UnitOfMeasure, UoMName, UoMType } from "./models";

/**
 * In some cases, ConvertUnits make an exception
 * e.g. cups -> grams
 * We can solve it with BFS or DFS
 * @param fromUoM 
 * @param toUoMName 
 * @param toUoMType 
 * @returns 
 */
export function AdvancedConvertUnits(
    fromUoM: UnitOfMeasure,
    toUoMName: UoMName,
    toUoMType: UoMType
): UnitOfMeasure {
    try {
        const uom = ConvertUnits(fromUoM, toUoMName, toUoMType);
        return uom;
    } catch (error) {
        return ConvertUnit2(fromUoM, toUoMName, toUoMType);
    }
}

// BFS

function ConvertUnit2(
    fromUoM: UnitOfMeasure,
    toUoMName: UoMName,
    toUoMType: UoMType
): UnitOfMeasure {

    let flag = {};
    let queue: Array<number> = [];
    let conversionRateQueue: Array<number> = [];
    let res = -1;
    let conversionFactor = 0;

    let units = [...GetUnitsData()];
    const n = units.length;
    for (let i = 0; i < n; i++) {
        units.push({
            fromUnitName: units[i].toUnitName,
            fromUnitType: units[i].toUnitType,
            toUnitName: units[i].fromUnitName,
            toUnitType: units[i].fromUnitType,
            conversionFactor: 1 / units[i].conversionFactor
        });
    }

    for (let i = 0; i < units.length; i++) {
        if (units[i].fromUnitName == fromUoM.uomName && units[i].fromUnitType == fromUoM.uomType) {
            queue.push(i);
            conversionRateQueue.push(units[i].conversionFactor);
            flag[i] = true;
        }
    }

    while (queue.length > 0) {
        let top = queue.shift()!;
        conversionFactor = conversionRateQueue.shift()!;
        if (units[top].toUnitName == toUoMName && units[top].toUnitType == toUoMType) {
            res = top;
            break;
        }

        for (let i = 0; i < units.length; i++) {
            if (flag[i] == undefined && units[top].toUnitName == units[i].fromUnitName && units[top].toUnitType == units[i].fromUnitType) {
                flag[i] = true;
                queue.push(i);
                conversionRateQueue.push(conversionFactor * units[i].conversionFactor);
            }
        }
    }

    if (res != -1) {
        return {
            uomAmount: fromUoM.uomAmount * conversionFactor,
            uomName: toUoMName,
            uomType: toUoMType
        };
    }
    // return {} as any;
    throw new Error(`Really Couldn't convert ${fromUoM.uomName} to ${toUoMName}`);
}

export function SumUnitsOfMeasure(
    uomA: UnitOfMeasure,
    uomB: UnitOfMeasure
): UnitOfMeasure {
    const convertedUomB = AdvancedConvertUnits(uomB, uomA.uomName, uomA.uomType);
    return {
        uomAmount: uomA.uomAmount + convertedUomB.uomAmount,
        uomName: uomA.uomName,
        uomType: uomA.uomType
    };
}