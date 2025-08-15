# Terminal Chat (Client)

A secure, end-to-end encrypted, terminal-based chat application built with TypeScript, Node.js, and Ink.

**Note:** The backend server for this project can be found here: [github.com/your-username/terminal-chat-backend](https://github.com/your-username/terminal-chat-backend)


---

## ✨ Features

* **End-to-End Encryption**: All messages are encrypted using a hybrid RSA and AES-256-GCM system. The server never sees your plain text messages.
* **Real-Time Messaging**: Instant message delivery using WebSockets.
* **Persistent Sessions**: Stay logged in between sessions.
* **Modern Terminal UI**: Built with Ink and React, providing a responsive and user-friendly interface.
* **User Discovery**: Search for other users to start new conversations.
* **Unread Message Counts**: Keep track of new messages from all your contacts, sorted by recent activity.

---

## 🚀 Getting Started

### Prerequisites

For the best experience, your terminal environment should have:

* **A Modern Terminal Emulator**: A terminal that supports truecolor (24-bit color) is recommended for the best visual experience. Examples include Kitty, iTerm2, Alacritty, or Windows Terminal.
* **A Nerd Font**: To ensure emojis and other special characters render correctly, it is highly recommended to use a [Nerd Font](https://www.nerdfonts.com/).
* **Bun**: You must have the [Bun](https://bun.sh/) runtime installed to run the application from source.

### Installation & Usage

1.  **Download:**
    Download the latest release executable for your operating system (`terminal-chat-linux`, `terminal-chat-macos`, or `terminal-chat-win.exe`) from the [Releases](https://github.com/your-username/terminal-chat-client/releases) page on GitHub.

2.  **Run:**
    Open your terminal, navigate to the folder where you downloaded the file, and run it:

    ```bash
    # For Linux/macOS (you may need to make it executable first)
    chmod +x ./terminal-chat-linux
    ./terminal-chat-linux

    # For Windows (in Command Prompt or PowerShell)
    .\terminal-chat-win.exe
    ```

---

## 🛠️ For Developers (Running from Source)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/tesla77coded/terminal-chat-client.git](https://github.com/tesla77coded/terminal-chat-client.git)
    cd terminal-chat-client
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Run the application:**
    ```bash
    bun run start
    ```

---

## 💻 Tech Stack

* **UI Framework**: [Ink](https://github.com/vadimdemedes/ink) & [React](https://reactjs.org/)
* **Language**: TypeScript
* **Backend Communication**: Axios & WebSockets
* **Cryptography**: Node.js `crypto` module
* **Packaging**: Bun
