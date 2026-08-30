import { createOverlayStore } from '@/shared/overlay/createOverlayStore';

export interface EditCategoryPayload {
  transactionId: string;
}

/**
 * The edit modal lives inside transaction-list rather than as its own feature — otherwise a row
 * would have to import a separate feature's store to open it, which is a cross-feature import
 * (ROADMAP §5.4).
 */
export const useEditCategoryOverlay = createOverlayStore<EditCategoryPayload>();
