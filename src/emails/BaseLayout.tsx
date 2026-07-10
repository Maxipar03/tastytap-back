import { Body, Container, Head, Html, Tailwind, Text, Section } from '@react-email/components';
import * as React from 'react';

const SERIF_STACK = "'Fraunces', Georgia, 'Times New Roman', serif";
const SANS_STACK = "'Manrope', Arial, Helvetica, sans-serif";

export const BaseLayout = ({ children }: { children: React.ReactNode }) => (
    <Html>
        <Head>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Manrope:wght@400;600;700&display=swap');

        body {
          font-family: ${SANS_STACK} !important;
        }
      `}</style>
        </Head>
        <Tailwind>
            <Body className="bg-[#F7F2EA] py-10">
                <Container
                    className="max-w-[600px] overflow-hidden rounded-2xl border border-solid border-[#20191512] bg-white"
                    style={{ border: '1px solid rgba(32,27,21,0.1)' }}
                >
                    {/* Header */}
                    <Section className="border-b border-solid border-[#20191512] bg-white px-8 py-7" style={{ borderBottom: '1px solid rgba(32,27,21,0.08)' }}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                            <tr>
                                <td width="28" style={{ verticalAlign: 'middle' }}>
                                    <table role="presentation" cellPadding={0} cellSpacing={0}>
                                        <tr>
                                            <td
                                                width="28"
                                                height="28"
                                                align="center"
                                                style={{
                                                    backgroundColor: '#201B15',
                                                    borderRadius: 6,
                                                    color: '#F7F2EA',
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    fontFamily: SANS_STACK,
                                                }}
                                            >
                                                TT
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td style={{ verticalAlign: 'middle', paddingLeft: 10 }}>
                                    <Text
                                        className="m-0 text-lg text-[#201B15]"
                                        style={{ fontFamily: SERIF_STACK, margin: 0 }}
                                    >
                                        TastyTap
                                    </Text>
                                </td>
                            </tr>
                        </table>
                    </Section>

                    {/* Contenido dinámico */}
                    <Section className="px-8 py-8 text-[#201B15]" style={{ fontFamily: SANS_STACK }}>
                        {children}
                    </Section>

                    {/* Footer */}
                    <Section className="bg-[#F7F2EA] px-6 py-6 text-center text-[#55493C]">
                        <Text className="m-0 text-xs" style={{ fontFamily: SANS_STACK }}>
                            © {new Date().getFullYear()} TastyTap. Producto en etapa de lanzamiento.
                        </Text>
                        <Text className="m-0 mt-1.5 text-xs" style={{ fontFamily: SANS_STACK }}>
                            ¿Dudas? Escribinos a{' '}
                            <a href="mailto:hola@tastytap.app" style={{ color: '#C1502E', textDecoration: 'underline' }}>
                                hola@tastytap.app
                            </a>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Tailwind>
    </Html>
);