import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

type ChatSender = 'user' | 'bot';

interface ChatMessage {
  from: ChatSender;
  text: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.scss'
})
export class ChatbotWidget {
  protected readonly isOpen = signal(false);

  protected readonly messages = signal<ChatMessage[]>([
    {
      from: 'bot',
      text: 'Bonjour 👋 Je suis votre assistant Frigorifique du Sud. Comment puis-je vous aider ?'
    }
  ]);

  protected readonly faqs: FaqItem[] = [
    {
      question: 'Comment passer une commande ?',
      answer: 'Vous pouvez passer votre commande directement depuis la page “Nos produits”. Ajoutez les articles au panier puis validez votre commande depuis le panier.'
    },
    {
      question: 'Quels sont les délais de livraison ?',
      answer: 'Les délais de livraison moyens sont de 3 à 5 jours ouvrés selon votre localisation. Vous verrez une estimation précise au moment de la commande.'
    },
    {
      question: 'Comment vous contacter ?',
      answer: 'Vous pouvez nous contacter via la page “Contact”, par email ou téléphone. Toutes les informations sont indiquées dans la rubrique Contact.'
    },
    {
      question: 'D’où proviennent vos dattes ?',
      answer: 'Nos dattes proviennent de producteurs sélectionnés avec soin dans le sud tunisien, avec un contrôle qualité strict à chaque étape.'
    },
    {
      question: 'Puis-je commander en gros pour mon entreprise ?',
      answer: 'Oui, nous proposons des commandes en gros pour les professionnels. Contactez-nous via la page “Contact” pour un devis personnalisé.'
    }
  ];

  toggleOpen(): void {
    this.isOpen.set(!this.isOpen());
  }

  selectFaq(item: FaqItem): void {
    const current = this.messages();

    this.messages.set([
      ...current,
      { from: 'user', text: item.question },
      { from: 'bot', text: item.answer }
    ]);

    if (!this.isOpen()) {
      this.isOpen.set(true);
    }
  }
}

