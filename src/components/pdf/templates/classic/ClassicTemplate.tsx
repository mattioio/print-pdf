import { Document } from '@react-pdf/renderer';
import type { BrochureData } from '../../../../types/brochure';
import ClassicPage1 from './ClassicPage1';
import '../../shared/fonts';

export default function ClassicTemplate({ data }: { data: BrochureData }) {
  return (
    <Document>
      <ClassicPage1 data={data} />
    </Document>
  );
}
