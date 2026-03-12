import type { TemplateDefinition } from '../../../types/brochure';
import ClassicTemplate from './classic/ClassicTemplate';

export const templates: Record<string, TemplateDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional commercial property brochure with gold accents',
    component: ClassicTemplate,
  },
};
