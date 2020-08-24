import { ng } from 'entcore';

export const odeFlattenArrayOfObjects = ng.filter('odeFlattenArrayOfObjects', function() {
    return function(inArray: Array<Object>, flattenProperties?: Array<String>) {
        console.log(inArray);
        console.log(flattenProperties);
        if (!inArray) {
            return [];
        }
        
        if (flattenProperties && flattenProperties.length === 0) {
            return inArray;
        }
        
        let flattenedArray = Array.from(inArray);

        const flatten = (array: Array<Object>) => {
            array.forEach(item => {
                for (const prop in item) {
                    const val = item[prop];
                    if (val 
                        && val instanceof Array 
                        && !flattenProperties 
                        || flattenProperties.indexOf(prop) > -1) {
                        flattenedArray = [...flattenedArray, ...val];
                        flatten(val);
                    }
                }
            });
        };
        flatten(inArray);

        return Array.from(new Set<Object>(flattenedArray));
    };
});