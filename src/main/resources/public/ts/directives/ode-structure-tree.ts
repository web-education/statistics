import { ng } from 'entcore';

declare let angular;

interface StructureTreeScope {
    // inputs, outputs
    items: Array<any>;
    childrenProperty: string;
    classesProperty: string;
    filter: string | Object;
    select: Function;
    flattenProperties: Array<string>;
    
    // functions
    safeApply(fn: Function): void;
    hasChildren(item: any): boolean;
    hasClasses(item: any): boolean;
    getChildren(item: any): Array<any>;
    getClasses(item: any): Array<any>;
    toggleChildren($event): void;
    selectItem(id: string): void;
    bubbleSelect(id: string): void;
    isFlatten(): boolean;
    isFiltered(): boolean;
}

//function to compile template recursively
function compileRecursive($compile, element, link) {
    // Normalize the link parameter
    if (angular.isFunction(link)) {
        link = { post: link };
    }
    // Break the recursion loop by removing the contents
    const contents = element.contents().remove();
    let compiledContents;
    return {
        pre: (link && link.pre) ? link.pre : null,
        /**
         * Compiles and re-adds the contents
         */
        post: function (scope, element) {
            // Compile the contents
            if (!compiledContents) {
                compiledContents = $compile(contents);
            }
            // Re-add the compiled contents to the element
            compiledContents(scope, function (clone) {
                element.append(clone);
            });

            // Call the post-linking function, if any
            if (link && link.post) {
                link.post.apply(null, arguments);
            }
        }
    };
}

export const odeStructureTree = ng.directive('odeStructureTree', ['$compile', ($compile) => {
    return {
        restrict: 'E',
        scope: {
            items: '=',
            childrenProperty: '=?',
            classesProperty: '=?',
            filter: '=?',
            flattenProperties: '=?',
            select: '&'
        },
        template: `
            <ul ng-class="{flatten: isFlatten()}">
                <li ng-repeat="item in (items | odeFlattenArrayOfObjects: flattenProperties | filter: filter)">
                    <span ng-click="toggleChildren($event)"
                          ng-class="{caret: hasChildren(item) || hasClasses(item)}"
                          ng-if="!isFlatten()"></span>
                    <span ng-click="selectItem(item.id)">[[item.name]]</span>
                    <ul ng-class="{flatten: isFlatten()}"
                        class="nested" 
                        ng-if="hasChildren(item)">
                        <ode-structure-tree items="getChildren(item)" 
                                            filter="filter" 
                                            flatten-properties="flattenProperties"
                                            select="bubbleSelect(id)">
                        </ode-structure-tree>
                    </ul>
                    <ul ng-class="{flatten: isFlatten()}" 
                        class="nested" 
                        ng-if="hasClasses(item)">
                        <li ng-repeat="class in getClasses(item) | filter: filter" 
                            ng-click="selectItem(class.id)">[[class.name]]</li>
                    </ul>
                </li>
            </ul>
        `,
        compile: function (element) {
            // Use the compile function from the RecursionHelper,
            // And return the linking function(s) which it returns
            return compileRecursive($compile, element, (scope: StructureTreeScope) => {
                if (!scope.childrenProperty) {
                    scope.childrenProperty = 'children';
                }
                if (!scope.classesProperty) {
                    scope.classesProperty = 'classes';
                }
                if (!scope.flattenProperties) {
                    scope.flattenProperties = [];
                }
                
                scope.safeApply = function (fn) {
                    const phase = this.$root.$$phase;
                    if (phase == '$apply' || phase == '$digest') {
                        if (fn && (typeof (fn) === 'function')) {
                            fn();
                        }
                    } else {
                        this.$apply(fn);
                    }
                };
                
                scope.hasChildren = function(item) {
                    return item[scope.childrenProperty] && item[scope.childrenProperty].length > 0;
                }
                
                scope.hasClasses = function(item) {
                    return item[scope.classesProperty] && item[scope.classesProperty].length > 0;
                }
                
                scope.getChildren = function(item) {
                    return item[scope.childrenProperty];
                }
                
                scope.getClasses = function(item) {
                    return item[scope.classesProperty];
                }
                
                scope.toggleChildren = function($event) {
                    const nestedElement = $event.target.parentElement.querySelector(".nested");
                    if (nestedElement) {
                        nestedElement.classList.toggle("active");
                    }
                    $event.target.classList.toggle("caret-down");
                };
                
                scope.isFlatten = function() {
                    return scope.flattenProperties 
                        && scope.flattenProperties.length > 0
                        && scope.isFiltered();
                };
                
                scope.isFiltered = function() {
                    if (!scope.filter) {
                        return false;
                    }
                    if (typeof scope.filter === 'string') {
                        return scope.filter.length > 0;
                    } else if (scope.filter.constructor === Object) {
                        return Object.values(scope.filter).some(v => v);
                    }
                }
                
                scope.selectItem = function(id: string) {
                    scope.select({'id': id});
                }
                scope.bubbleSelect = function(id: string) {
                    scope.select({'id': id});
                }                
            });
        }
    }
}])