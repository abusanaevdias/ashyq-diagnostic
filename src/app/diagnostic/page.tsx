import DiagnosticApp from '@/components/DiagnosticApp';

/**
 * /diagnostic — отдельная точка входа для WhatsApp-рассылок с UTM:
 * /diagnostic?utm_source=whatsapp&utm_campaign=cold01&utm_content=hook_a
 */
export default function DiagnosticPage() {
  return <DiagnosticApp />;
}
