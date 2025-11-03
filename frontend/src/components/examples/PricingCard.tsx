import PricingCard from '../PricingCard'

export default function PricingCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <PricingCard
        title="Silver Plan"
        titleGu="ચાંદી યોજના"
        price="₹149"
        period="month"
        icon="🌿"
        highlighted={true}
        features={[
          { text: "Everything in Free Plan", textGu: "મફત યોજનામાં બધુ" },
          { text: "Ask up to 30 AI questions daily", textGu: "30 પ્રશ્નો પ્રતિદિન" },
          { text: "Deep spiritual meanings", textGu: "ગહન અર્થ સાથે ઉદાહરણો" },
        ]}
        idealFor="Regular readers and curious devotees"
        idealForGu="નિયમિત વાંચકો અને જિજ્ઞાસુ ભક્તો"
      />
    </div>
  )
}
