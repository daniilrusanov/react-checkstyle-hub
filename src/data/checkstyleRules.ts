/**
 * Checkstyle Rules Data
 * 
 * This module contains metadata for all Checkstyle rules available in the application.
 * Rules are organized by categories for better user experience in the configuration modal.
 */

/**
 * Information about a single Checkstyle rule
 */
export interface RuleInfo {
    /** Display the name of the rule (localized) */
    name: string;
    /** Detailed description of what the rule checks */
    description: string;
    /** Category to which the rule belongs */
    category: string;
}

/**
 * Complete the collection of Checkstyle rules with their metadata
 * 
 * Keys correspond to field names in the CheckstyleConfig interface.
 * Used for rendering rule information in the configuration UI.
 */
export const CHECKSTYLE_RULES: Record<string, RuleInfo> = {
    severity: {
        name: 'Рівень суворості',
        description: 'Визначає базовий рівень суворості для всіх перевірок (warning, error, info)',
        category: 'Загальні'
    },
    lineLength: {
        name: 'Максимальна довжина рядка',
        description: 'Максимальна кількість символів у рядку коду',
        category: 'Загальні'
    },
    avoidStarImport: {
        name: 'Уникати зіркових імпортів',
        description: 'Забороняє використання import з * (наприклад, import java.util.*)',
        category: 'Імпорти'
    },
    oneTopLevelClass: {
        name: 'Один клас верхнього рівня',
        description: 'Один файл повинен містити лише один клас верхнього рівня',
        category: 'Структура класу'
    },
    outerTypeFilename: {
        name: 'Відповідність імені файлу',
        description: 'Ім\'я зовнішнього типу повинно відповідати імені файлу',
        category: 'Структура класу'
    },
    finalClass: {
        name: 'Final клас',
        description: 'Клас з лише приватними конструкторами має бути final',
        category: 'Структура класу'
    },
    hideUtilityClassConstructor: {
        name: 'Приховати конструктор утилітного класу',
        description: 'Утилітні класи не повинні мати публічного конструктора',
        category: 'Структура класу'
    },
    interfaceIsType: {
        name: 'Інтерфейс як тип',
        description: 'Інтерфейс повинен описувати тип, а не лише константи',
        category: 'Структура класу'
    },
    visibilityModifier: {
        name: 'Модифікатори видимості',
        description: 'Перевіряє видимість змінних класу (поля мають бути приватними)',
        category: 'Структура класу'
    },
    noLineWrap: {
        name: 'Заборона переносу рядків',
        description: 'Заборона переносу рядків для package та import виразів',
        category: 'Форматування'
    },
    leftCurly: {
        name: 'Ліва фігурна дужка',
        description: 'Перевіряє розміщення лівої фігурної дужки',
        category: 'Форматування'
    },
    rightCurly: {
        name: 'Права фігурна дужка',
        description: 'Перевіряє розміщення правої фігурної дужки',
        category: 'Форматування'
    },
    emptyBlock: {
        name: 'Порожні блоки',
        description: 'Перевіряє порожні блоки коду (catch, finally, try тощо)',
        category: 'Блоки'
    },
    needBraces: {
        name: 'Обов\'язкові фігурні дужки',
        description: 'Вимагає фігурні дужки для if, else, for, while навіть для однорядкового коду',
        category: 'Блоки'
    },
    emptyStatement: {
        name: 'Порожні вирази',
        description: 'Виявляє порожні вирази (зайві крапки з комою)',
        category: 'Якість коду'
    },
    equalsHashCode: {
        name: 'Equals і HashCode',
        description: 'Перевіряє, що клас перевизначає equals() і hashCode() разом',
        category: 'Якість коду'
    },
    illegalInstantiation: {
        name: 'Заборонена ініціалізація',
        description: 'Забороняє створення екземплярів певних класів (Boolean, String)',
        category: 'Якість коду'
    },
    missingSwitchDefault: {
        name: 'Відсутня гілка default у switch',
        description: 'Вимагає наявності default гілки в конструкції switch',
        category: 'Якість коду'
    },
    simplifyBooleanExpression: {
        name: 'Спростити булеві вирази',
        description: 'Виявляє надмірно складні булеві вирази',
        category: 'Якість коду'
    },
    simplifyBooleanReturn: {
        name: 'Спростити булеве повернення',
        description: 'Виявляє надмірно складні булеві return вирази',
        category: 'Якість коду'
    },
    illegalTokenText: {
        name: 'Заборонений текст токенів',
        description: 'Виявляє використання escape-послідовностей замість Unicode',
        category: 'Токени'
    },
    avoidEscapedUnicodeCharacters: {
        name: 'Уникати екранованих Unicode',
        description: 'Обмежує використання Unicode escape-послідовностей',
        category: 'Токени'
    },
};

/**
 * Ordered list of all rule categories
 * 
 * Used to maintain consistent ordering in the UI.
 * Categories group related rules together for better organization.
 */
export const RULE_CATEGORIES = [
    'Загальні',
    'Імпорти',
    'Структура класу',
    'Форматування',
    'Блоки',
    'Якість коду',
    'Токени'
];

/**
 * Gets all rule keys that belong to a specific category
 * 
 * @param category - The category name to filter by
 * @returns Array of rule keys (field names) in the specified category
 * 
 * @example
 * const codeQualityRules = getRulesByCategory('Якість коду');
 * // Returns: ['emptyStatement', 'equalsHashCode', ...]
 */
export const getRulesByCategory = (category: string): string[] => {
    return Object.keys(CHECKSTYLE_RULES).filter(
        key => CHECKSTYLE_RULES[key].category === category
    );
};
