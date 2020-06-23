import { dateService } from "./date.service";

export class CacheService {
    
    public needsRefresh(date: Date): boolean {
        return dateService.moreThanOneHourAgo(date);
    }
}

export const cacheService = new CacheService();