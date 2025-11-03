import WelcomeCard from '../WelcomeCard'

export default function WelcomeCardExample() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <WelcomeCard onPromptClick={(prompt) => console.log('Prompt clicked:', prompt)} />
    </div>
  )
}
