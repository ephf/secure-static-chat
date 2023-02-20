import firebase, { parseObject, parse } from "firebase.js";
const firebaseName = await fetch("firebase-name.json").then((res) =>
  res.json()
);

const { password } = JSON.parse(localStorage.account);
function Limbo({ callback }) {
  const node = document.createTextNode("");
  callback().then((element) => node.replaceWith(element));
  return node;
}

function Message({ content, me }) {
  return (
    <p
      class={`px-3 py-1 w-[fit-content] rounded-full mb-[1px] ${
        me ? "self-end glass-bg text-[var(--color)]" : "blue-bg text-white"
      }`}
    >
      {content}
    </p>
  );
}

export default function MessageStream({ id, key, closeEvent, author }) {
  const events = new EventSource(
    `https://${firebaseName}-default-rtdb.firebaseio.com/rooms/${id}/messages.json`
  );

  let lastMessage = { author: null },
    streamView;
  async function displayMessage(message) {
    const {
      author: messageAuthor,
      content,
      type,
    } = parseObject(message, key, true);
    const messageElement = (
      <Message content={content} me={messageAuthor == author} />
    );
    if (lastMessage.author == messageAuthor) {
      lastMessage.element.append(messageElement);
      return;
    }
    lastMessage = {
      author: messageAuthor,
      element: (
        <div class="flex flex-col box-border px-2 w-full">
          {messageAuthor == author ? null : (
            <p class="text-xs text-gray-400 ml-2">
              {await firebase.get(`accounts/${messageAuthor}/username`)}
            </p>
          )}
          {messageElement}
        </div>
      ),
    };
    streamView.prepend(lastMessage.element);
  }

  events.addEventListener("put", async ({ data }) => {
    const { path, data: message } = JSON.parse(data);
    if (path == "/") {
      for (const [, msg] of Object.entries(message ?? {})) {
        await displayMessage(msg);
      }
      return;
    }

    await displayMessage(message);
  });
  closeEvent.close = () => events.close();
  return (
    <div class="flex flex-col h-full">
      <nav class="basis-9 shadow center grid-flow-col">
        <Limbo
          callback={async () => (
            <h2 class="w-full text-left ml-5 font-semibold">
              {parse(await firebase.get(`rooms/${id}/name`), key).toParsed()}
            </h2>
          )}
        />
        <div class="w-full flex justify-end">
          <div class="flex gap-3 mr-3">
            <button
              onclick={async () => {
                const filteredRooms = Object.fromEntries(
                  Object.entries(
                    await firebase.get(`accounts/${author}/rooms`)
                  ).filter(
                    ([, room]) => parse(room.roomID, password).toParsed() != id
                  )
                );
                await firebase.put(`accounts/${author}/rooms`, filteredRooms);
                closeEvent.close();
                streamView.prepend(
                  <p class="w-full text-center text-gray-300">
                    You left the room
                  </p>
                );
              }}
            >
              <img src="https://img.icons8.com/ios-glyphs/20/null/logout-rounded--v1.png" />
            </button>
            <button
              onclick={async () => {
                const username = prompt("Who do you want to invite?");
                const account = (await firebase.get("accounts").array()).find(
                  (account) => account.username == username
                );
                if (!account) {
                  alert("There is no account with that name");
                  return;
                }

                await firebase.put(`accounts/${account.id}/invite`, {
                  id,
                  key,
                });
                await firebase.put(`accounts/${account.id}/invite`, {});
              }}
            >
              <img src="https://img.icons8.com/windows/20/null/add-user-male--v1.png" />
            </button>
          </div>
        </div>
      </nav>
      {
        (streamView = (
          <div class="flex flex-col-reverse grow h-0 overflow-y-scroll"></div>
        ))
      }
      <div class="basis-12 center">
        <div class="w-full h-full box-border p-2">
          <input
            placeholder="Message"
            class="w-full h-full box-border px-5 outline-none border-[.15em] border-gray-300 rounded-full text-[var(--color)]"
            onkeydown={async function (ev) {
              if (ev.key == "Enter") {
                ev.preventDefault();
                if (!this.value) return;
                await firebase.post(
                  `rooms/${id}/messages`,
                  parseObject(
                    { author, content: this.value, type: "message" },
                    key
                  )
                );
                this.value = "";
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
