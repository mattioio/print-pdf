import { Document } from '@react-pdf/renderer';
import type { BrochureData } from '../../../../types/brochure';
import ModernPage1 from './ModernPage1';
import '../../shared/fonts';

export default function ModernTemplate({ data }: { data: BrochureData }) {
  return (
    <Document>
      <ModernPage1 data={data} />
    </Document>
  );
}
