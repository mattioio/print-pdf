import { Document } from '@react-pdf/renderer';
import type { BrochureData } from '../../../../types/brochure';
import ClassicPage2 from '../classic/ClassicPage2';
import ClassicPage1 from '../classic/ClassicPage1';
import '../../shared/fonts';

export default function SwappedTemplate({ data }: { data: BrochureData }) {
  return (
    <Document>
      <ClassicPage2 data={data} />
      <ClassicPage1 data={data} />
    </Document>
  );
}
