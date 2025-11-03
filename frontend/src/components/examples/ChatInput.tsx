import ChatInput from '../ChatInput'

export default function ChatInputExample() {
  return (
    <div className="h-40">
      <ChatInput 
        onSendMessage={(msg) => console.log('Message sent:', msg)} 
        disabled={false}
      />
    </div>
  )
}
