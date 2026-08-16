import {
    Apple,
    Baby,
    Beef,
    Candy,
    Carrot,
    ChefHat,
    Cookie,
    CupSoda,
    Droplet,
    Dumbbell,
    Fish,
    Flame,
    GlassWater,
    HeartPulse,
    IceCreamBowl,
    Leaf,
    LucideIcon,
    Milk,
    Package,
    PawPrint,
    Pill,
    PillBottle,
    Sandwich,
    ShoppingCart,
    SprayCan,
    Syringe,
    Utensils,
    Vegan,
} from "lucide-react";

type CategoryStyle = {
    icon: LucideIcon;
    color: string;
};


const KEYWORD_RULES: { keywords: string[]; icon: LucideIcon; color: string }[] = [
    { keywords: ["whey", "bcaa", "eaa", "casein", "hmb", "creatine", "gainer", "mass", 'pre-workout'], icon: PillBottle, color: "bg-rose-100 text-rose-700" },
    { keywords: ["accessories"], icon: Dumbbell, color: "bg-sky-100 text-sky-700" },
    { keywords: ["beverage", "drink", "soda", "coca", "juice", "coffee", "tea", "water"], icon: CupSoda, color: "bg-blue-100 text-blue-700" },
    { keywords: ["diet food"], icon: Beef, color: "bg-orange-100 text-orange-700" },
    { keywords: ["herb"], icon: Vegan, color: "bg-green-100 text-green-700" },
    { keywords: ["snack", "cookie", "cracker", "chip", "protein"], icon: Cookie, color: "bg-amber-100 text-amber-700" },
    { keywords: ["physiology", "hormones"], icon: Syringe, color: "bg-purple-100 text-purple-700" },
    { keywords: ["spices", 'processing'], icon: ChefHat, color: "bg-gray-100 text-gray-700" },
    { keywords: ['sauces', 'condiments'], icon: Droplet, color: "bg-blue-100 text-blue-700" },
    { keywords: ["health", "vitamin", "supplement", "mineral", "zma", "glutamine", "thermo"], icon: HeartPulse, color: "bg-emerald-100 text-emerald-700" },
];

const FALLBACK_PALETTE: CategoryStyle[] = [
    { icon: Package, color: "bg-green-100 text-green-700" },
    { icon: PillBottle, color: "bg-teal-100 text-teal-700" },
    { icon: Leaf, color: "bg-emerald-100 text-emerald-700" },
    { icon: Apple, color: "bg-red-100 text-red-700" },
    { icon: Milk, color: "bg-yellow-100 text-yellow-700" },
    { icon: CupSoda, color: "bg-blue-100 text-blue-700" },
];

const hashName = (name: string): number =>
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

export const getCategoryDisplay = (name: string): CategoryStyle => {
    const lower = name.toLowerCase();

    for (const rule of KEYWORD_RULES) {
        if (rule.keywords.some((keyword) => lower.includes(keyword))) {
            return { icon: rule.icon, color: rule.color };
        }
    }

    return FALLBACK_PALETTE[hashName(name) % FALLBACK_PALETTE.length];
};
