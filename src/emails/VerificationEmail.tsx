import { Heading, Text, Section } from '@react-email/components';
import { BaseLayout } from './BaseLayout';

const SERIF_STACK = "'Fraunces', Georgia, 'Times New Roman', serif";
const SANS_STACK = "'Manrope', Arial, Helvetica, sans-serif";

export default function VerificationEmail({ code = '000000' }: { code?: string }) {
    return (
        <BaseLayout>
            <Heading
                className="m-0 mb-4 text-xl text-[#201B15]"
                style={{ fontFamily: SERIF_STACK, fontStyle: 'italic', margin: '0 0 16px 0' }}
            >
                Verificá tu cuenta
            </Heading>
            <Text className="text-base text-[#55493C]" style={{ fontFamily: SANS_STACK }}>
                Tu código de verificación es:
            </Text>

            <Section
                className="my-6 rounded-xl border border-solid border-[#20191512] bg-[#F7F2EA] p-6 text-center"
                style={{ border: '1px solid rgba(32,27,21,0.1)', borderRadius: 12 }}
            >
                <Text
                    className="m-0 text-4xl font-bold text-[#C1502E]"
                    style={{ fontFamily: SERIF_STACK, letterSpacing: 8, margin: 0 }}
                >
                    {code}
                </Text>
            </Section>

            <Text className="text-sm text-[#55493C]" style={{ fontFamily: SANS_STACK }}>
                Este código expira en 10 minutos.
            </Text>
            <Text className="mt-4 text-xs text-[#55493C]/70" style={{ fontFamily: SANS_STACK, color: '#8a8177' }}>
                Si no fuiste vos quien lo solicitó, podés ignorar este email tranquilamente.
            </Text>
        </BaseLayout>
    );
}