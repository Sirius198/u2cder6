import {
    GetProductsForIngredient,
    GetRecipes,
    NutrientBaseUoM
} from "./supporting-files/data-access";
import { Recipe, SupplierProduct, UnitOfMeasure } from "./supporting-files/models";
import { RunTest, ExpectedRecipeSummary } from "./supporting-files/testing";
import { AdvancedConvertUnits, SumUnitsOfMeasure } from "./supporting-files/helper2";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for
const recipeSummary: any = {}; // the final result to pass into the test function

/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */

// $5/3cup -> ?/2kg
function calcPriceFromSupplier(
    supplierProduct: SupplierProduct,
    toUoM: UnitOfMeasure
): number {
    if (supplierProduct.supplierProductUoM.uomAmount == 0) {
        return 0;
    }

    const { uomName, uomType } = supplierProduct.supplierProductUoM;
    const uom = AdvancedConvertUnits(toUoM, uomName, uomType);
    return supplierProduct.supplierPrice / supplierProduct.supplierProductUoM.uomAmount * uom.uomAmount;
};

function calcNutrient(quantityAmount: UnitOfMeasure, quantityPer: UnitOfMeasure, toAmount: UnitOfMeasure): UnitOfMeasure {
    const { uomName, uomType } = quantityPer;

    const amt = AdvancedConvertUnits(quantityAmount, uomName, uomType);
    const per = AdvancedConvertUnits(quantityPer, uomName, uomType);
    const to = AdvancedConvertUnits(toAmount, uomName, uomType);

    return {
        uomAmount: per.uomAmount == 0 ? 0 : to.uomAmount * amt.uomAmount / per.uomAmount,
        uomName,
        uomType
    };
}

const calculateCheapestRecipeSummary = (receipe: Recipe): any => {
    let result = {
        cheapestCost: 0,
        nutrientsAtCheapestCost: {}
    }
    let nutrientsSum = {};

    for (const lineItem of receipe.lineItems) {

        // Find cheapest product for each ingredient

        let products = GetProductsForIngredient(lineItem.ingredient);
        if (products.length == 0) {
            continue;
        }

        let [product_id, cost] = products.reduce((acc, prod, i) => {

            let [prod_id, minCost] = acc;

            for (const supplierProduct of prod.supplierProducts) {
                const price = calcPriceFromSupplier(supplierProduct, lineItem.unitOfMeasure);

                if (price < minCost) {
                    prod_id = i;
                    minCost = price;
                }
            }

            return [prod_id, minCost];
        }, [0, 99999999]);

        // Calculate price for required ingredient amount
        result.cheapestCost += cost;

        // Calculate nutrients
        for (const fact of products[product_id].nutrientFacts) {
            const nutrientName = fact.nutrientName;

            const uom = calcNutrient(fact.quantityAmount, fact.quantityPer, lineItem.unitOfMeasure);
            if (nutrientName in nutrientsSum == false) {
                nutrientsSum[nutrientName] = uom;
            } else {
                nutrientsSum[nutrientName] = SumUnitsOfMeasure(nutrientsSum[nutrientName], uom);
            }
        }
    }

    // Calculate total quantity
    let totalQuantity: UnitOfMeasure = {...NutrientBaseUoM};
    totalQuantity.uomAmount = 0;
    for (var i = 0; i < receipe.lineItems.length; i++) {
        totalQuantity = SumUnitsOfMeasure(totalQuantity, receipe.lineItems[i].unitOfMeasure);
    }

    for (const nutrientName in nutrientsSum) {
        result.nutrientsAtCheapestCost[nutrientName] = {
            nutrientName,
            quantityAmount: calcNutrient(nutrientsSum[nutrientName], totalQuantity, NutrientBaseUoM),
            quantityPer: NutrientBaseUoM
        };
    }

    return result
}

for (const recipe of recipeData) {
    recipeSummary[recipe.recipeName] = calculateCheapestRecipeSummary(recipe);
}
console.log(JSON.stringify(recipeSummary, null, 4))

/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);
