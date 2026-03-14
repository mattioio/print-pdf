import type { TemplateDefinition } from '../../../types/brochure';
import ClassicTemplate from './classic/ClassicTemplate';
import SwappedTemplate from './test-swapped/SwappedTemplate';
import ClassicForm from '../../form/templates/ClassicForm';

export const templates: Record<string, TemplateDefinition> = {
  classic: {
    id: 'classic',
    name: 'Jenkins Law Brochure',
    description: 'Traditional commercial property brochure with gold accents',
    pdfComponent: ClassicTemplate,
    formComponent: ClassicForm,
    defaultData: {
      headline: 'COMMERCIAL PROPERTY TO LET',
      rent: 'Upon Application.',
      rates: 'Interested parties are advised to make their own enquiries directly with the Local Authority.',
      legalCosts: 'Each party to bear their own legal costs.',
      disclaimer:
        '*Misrepresentation Act:* Whilst every care is taken in the preparation of these particulars, the agents, any joint agents involved, and the vendor take no responsibility for any error, misstatement or omission in these details. Measurements are approximate and for guidance only. These particulars do not constitute an offer or contract and members of the Agents firm have no authority to make any representation or warranty in relation to the property.',
    },
  },
  ed3f47c6ebc54622: {
    id: 'ed3f47c6ebc54622',
    name: 'Test template',
    description: 'Pages swapped — page 2 first, page 1 second',
    pdfComponent: SwappedTemplate,
    formComponent: ClassicForm,
    defaultData: {
      headline: 'COMMERCIAL PROPERTY TO LET',
      rent: 'Upon Application.',
      rates: 'Interested parties are advised to make their own enquiries directly with the Local Authority.',
      legalCosts: 'Each party to bear their own legal costs.',
      disclaimer:
        '*Misrepresentation Act:* Whilst every care is taken in the preparation of these particulars, the agents, any joint agents involved, and the vendor take no responsibility for any error, misstatement or omission in these details. Measurements are approximate and for guidance only. These particulars do not constitute an offer or contract and members of the Agents firm have no authority to make any representation or warranty in relation to the property.',
    },
  },
};
