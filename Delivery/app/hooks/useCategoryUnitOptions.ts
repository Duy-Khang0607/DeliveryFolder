import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import axios from "axios";

export type OptionItem = {
    _id: string;
    name: string;
};

const fetchCategoryOptions = async (q: string): Promise<OptionItem[]> => {
    const params = new URLSearchParams({
        limit: "20",
        page: "1",
        activeOnly: "true",
    });
    if (q) params.set("q", q);

    const { data } = await axios.get(`/api/auth/admin/get-categories?${params}`);
    return (data?.categories ?? []).map((item: OptionItem) => ({
        _id: String(item._id),
        name: item.name,
    }));
};

const fetchCategorySlider = async (): Promise<OptionItem[]> => {
    const params = new URLSearchParams({
        limit: "50",
        page: "1",
        activeOnly: "true",
    });

    const { data } = await axios.get(`/api/auth/user/get-categories?${params}`);
    return (data?.categories ?? []).map((item: OptionItem) => ({
        _id: String(item._id),
        name: item.name,
    }));
};

const fetchUnitOptions = async (q: string): Promise<OptionItem[]> => {
    const params = new URLSearchParams({
        limit: "20",
        page: "1",
        activeOnly: "true",
    });
    if (q) params.set("q", q);

    const { data } = await axios.get(`/api/auth/admin/get-units?${params}`);
    return (data?.units ?? []).map((item: OptionItem) => ({
        _id: String(item._id),
        name: item.name,
    }));
};

type UseCategoryOptionsConfig = {
    slider?: boolean;
};

export const useCategoryOptions = (
    search: string,
    enabled = true,
    config: UseCategoryOptionsConfig = {}
) => {
    const { slider = false } = config;
    const [debouncedQ] = useDebounce(slider ? "" : search, slider ? 0 : 300);

    return useQuery({
        queryKey: slider ? ["categories", "slider"] : ["categories", "options", debouncedQ],
        queryFn: () => (slider ? fetchCategorySlider() : fetchCategoryOptions(debouncedQ)),
        enabled,
        staleTime: slider ? 5 * 60_000 : 30_000,
    });
};

export const useUnitOptions = (search: string, enabled = true) => {
    const [debouncedQ] = useDebounce(search, 300);

    return useQuery({
        queryKey: ["units", "options", debouncedQ],
        queryFn: () => fetchUnitOptions(debouncedQ),
        enabled,
        staleTime: 30_000,
    });
};
