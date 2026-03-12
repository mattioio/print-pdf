import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';

/**
 * Simple markdown-to-PDF renderer for @react-pdf/renderer.
 *
 * Supports:
 *   *bold*  or  **bold**
 *   - bullet lists (lines starting with - or •)
 *   Line breaks (newlines)
 */

const s = StyleSheet.create({
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletDot: {
    width: 12,
    fontSize: 8.5,
    lineHeight: 1.75,
  },
  bulletContent: {
    flex: 1,
  },
  paragraph: {
    marginBottom: 4,
  },
});

interface RichTextProps {
  text: string;
  style?: Style | Style[];
}

/** Parse inline markdown (*bold*) into Text spans */
function parseInline(text: string, baseStyle?: Style | Style[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // *bold* or **bold** → bold
  const regex = /(\*{1,2})(.*?)\1/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      nodes.push(
        <Text key={`t-${lastIndex}`} style={baseStyle}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }

    nodes.push(
      <Text key={`b-${match.index}`} style={[baseStyle as Style, { fontWeight: 700, color: '#1a1a1a' }]}>
        {match[2]}
      </Text>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push(
      <Text key={`t-${lastIndex}`} style={baseStyle}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return nodes.length > 0 ? nodes : [<Text key="empty" style={baseStyle}>{text}</Text>];
}

export default function RichText({ text, style }: RichTextProps) {
  if (!text) return null;

  const hasBold = /\*/.test(text);
  const hasBullets = /^[-•]\s+/m.test(text);
  const hasMultiLine = text.includes('\n');

  // Simple text — return plain <Text> to preserve flex layout
  if (!hasBold && !hasBullets && !hasMultiLine) {
    return <Text style={style}>{text}</Text>;
  }

  // Single line with just bold — return <Text> with inline spans
  if (!hasBullets && !hasMultiLine && hasBold) {
    return <Text style={style}>{parseInline(text, style)}</Text>;
  }

  // Multi-line or bullets — need View wrapper
  const lines = text.split('\n');

  // If no bullets, render as a single <Text> with inline line breaks
  // so spacing stays tight (separate <Text> blocks create large gaps)
  if (!hasBullets) {
    const spans: React.ReactNode[] = [];
    let key = 0;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (i > 0) spans.push(<Text key={`br-${key++}`}>{'\n'}</Text>);
      if (trimmed === '') {
        // Empty line = small paragraph break
        spans.push(<Text key={`sp-${key++}`}>{'\n'}</Text>);
      } else {
        spans.push(...parseInline(trimmed, style).map((node, j) =>
          // Re-key inline nodes to avoid collisions
          React.isValidElement(node) ? React.cloneElement(node, { key: `ln-${key++}-${j}` }) : node
        ));
      }
    }
    return <Text style={style}>{spans}</Text>;
  }

  // Has bullets — need View wrapper for bullet rows
  const blocks: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^[-•]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-•]\s+/, '');
      blocks.push(
        <View style={s.bulletRow} key={key++}>
          <Text style={[style as Style, s.bulletDot]}>•</Text>
          <Text style={[style as Style, s.bulletContent]}>
            {parseInline(content, style)}
          </Text>
        </View>
      );
    } else if (trimmed === '') {
      blocks.push(<View style={{ height: 4 }} key={key++} />);
    } else {
      blocks.push(
        <Text style={style} key={key++}>
          {parseInline(trimmed, style)}
        </Text>
      );
    }
  }

  return <>{blocks}</>;
}
