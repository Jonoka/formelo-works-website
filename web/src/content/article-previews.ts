import type { ArticlePreview } from '../../../shared/editorial';
import { quoteGuidePreview } from './quote-guide-preview';

import { moqGuidePreview } from './moq-guide-preview';

// Local editorial drafts only; separate from published Sanity Article documents.
export const articlePreviews: ArticlePreview[] = [quoteGuidePreview, moqGuidePreview];
