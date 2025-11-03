import ChatMessage from '../ChatMessage'

export default function ChatMessageExample() {
  return (
    <div className="space-y-4 p-6 max-w-4xl mx-auto">
      <ChatMessage 
        message="Namaste. I am here to guide you through the sacred teachings of Vachanamrut. How may I assist you on your spiritual journey today?"
        isBot={true}
        timestamp={new Date()}
      />
      <ChatMessage 
        message="What does Vachanamrut teach about devotion and faith?"
        isBot={false}
        timestamp={new Date()}
      />
      <ChatMessage 
        message="The Vachanamrut emphasizes that true devotion (bhakti) is rooted in understanding the glory of God. It teaches that faith should be unwavering and based on the knowledge of God's supreme nature. The scriptures describe that through pure devotion and firm faith, one can attain liberation and eternal bliss in the service of God."
        isBot={true}
        timestamp={new Date()}
      />
    </div>
  )
}
