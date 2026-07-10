import { Heading, Text, Row, Column, Section, Hr, Button } from '@react-email/components';
import { BaseLayout } from './BaseLayout';

const SERIF_STACK = "'Fraunces', Georgia, 'Times New Roman', serif";
const SANS_STACK = "'Manrope', Arial, Helvetica, sans-serif";

interface Item {
    foodName: string;
    quantity: number;
    price: number;
}

interface ReceiptEmailProps {
    orderId: string;
    createdAt: Date; 
    items: Item[];
    pricing: {
        subtotal: number;
        tax: number;
        total: number;
    };
    orderUrl?: string; // link to the order-tracking page, shown only if provided
}

function fmtMoney(n: number) {
    return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function ReceiptEmail({
    orderId,
    // restaurantName,
    createdAt,
    items,
    pricing,
    orderUrl,
}: ReceiptEmailProps) {
    return (
        <BaseLayout>
            <Heading
                className="m-0 text-2xl text-[#201B15]"
                style={{ fontFamily: SERIF_STACK, fontStyle: 'italic', margin: 0 }}
            >
                ¡Gracias por tu pedido!
            </Heading>
            <Text className="mt-2 text-sm text-[#55493C]" style={{ fontFamily: SANS_STACK }}>
                Tu pedido fue confirmado.
            </Text>

            {/* Meta */}
            <Section className="mt-5 rounded-xl bg-[#F7F2EA] p-4" style={{ borderRadius: 12 }}>
                <Row>
                    <Column>
                        <Text className="m-0 text-[10px] uppercase tracking-widest text-[#55493C]" style={{ fontFamily: SANS_STACK }}>
                            Pedido
                        </Text>
                        <Text className="m-0 text-sm font-medium text-[#201B15]" style={{ fontFamily: SANS_STACK }}>
                            #{orderId.slice(-8).toUpperCase()}
                        </Text>
                    </Column>
                    <Column align="right">
                        <Text className="m-0 text-[10px] uppercase tracking-widest text-[#55493C]" style={{ fontFamily: SANS_STACK }}>
                            Fecha
                        </Text>
                        <Text className="m-0 text-sm font-medium text-[#201B15]" style={{ fontFamily: SANS_STACK }}>
                            {fmtDate(createdAt.toString())}
                        </Text>
                    </Column>
                </Row>
            </Section>

            {/* Items */}
            <Section className="mt-6">
                {items.map((item, i) => (
                    <Row key={i} className="py-2">
                        <Column>
                            <Text className="m-0 text-sm text-[#201B15]" style={{ fontFamily: SANS_STACK }}>
                                <span style={{ color: '#C1502E', fontWeight: 700 }}>{item.quantity}×</span>{' '}
                                {item.foodName}
                            </Text>
                        </Column>
                        <Column align="right">
                            <Text className="m-0 text-sm text-[#55493C]" style={{ fontFamily: SANS_STACK }}>
                                {fmtMoney(item.price * item.quantity)}
                            </Text>
                        </Column>
                    </Row>
                ))}
            </Section>

            <Hr style={{ borderColor: 'rgba(32,27,21,0.1)', margin: '20px 0' }} />

            {/* Pricing breakdown */}
            <Section>
                <Row className="py-1">
                    <Column>
                        <Text className="m-0 text-xs text-[#55493C]" style={{ fontFamily: SANS_STACK }}>Subtotal</Text>
                    </Column>
                    <Column align="right">
                        <Text className="m-0 text-xs text-[#55493C]" style={{ fontFamily: SANS_STACK }}>{fmtMoney(pricing.subtotal)}</Text>
                    </Column>
                </Row>
                <Row className="py-1">
                    <Column>
                        <Text className="m-0 text-xs text-[#55493C]" style={{ fontFamily: SANS_STACK }}>Impuestos</Text>
                    </Column>
                    <Column align="right">
                        <Text className="m-0 text-xs text-[#55493C]" style={{ fontFamily: SANS_STACK }}>{fmtMoney(pricing.tax)}</Text>
                    </Column>
                </Row>
                <Row className="pt-3">
                    <Column>
                        <Text
                            className="m-0 text-sm font-bold uppercase tracking-wide text-[#201B15]"
                            style={{ fontFamily: SANS_STACK }}
                        >
                            Total
                        </Text>
                    </Column>
                    <Column align="right">
                        <Text
                            className="m-0 text-xl text-[#C1502E]"
                            style={{ fontFamily: SERIF_STACK }}
                        >
                            {fmtMoney(pricing.total)}
                        </Text>
                    </Column>
                </Row>
            </Section>

            {/* CTA — only if we have somewhere to send them */}
            {orderUrl && (
                <Section className="mt-7 text-center">
                    <Button
                        href={orderUrl}
                        className="rounded-xl bg-[#201B15] px-6 py-3 text-sm font-semibold text-white no-underline"
                        style={{
                            backgroundColor: '#201B15',
                            color: '#F7F2EA',
                            borderRadius: 12,
                            padding: '12px 24px',
                            fontFamily: SANS_STACK,
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-block',
                        }}
                    >
                        Ver estado de tu pedido
                    </Button>
                </Section>
            )}
        </BaseLayout>
    );
}