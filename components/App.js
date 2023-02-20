import firebase, { parseObject, parse } from "firebase.js";
import MessageStream from "components/MessageStream.js";
const firebaseName = await fetch("firebase-name.json").then((res) =>
  res.json()
);

const { id, username, password } = JSON.parse(localStorage.account);
const rooms = (await firebase.get(`accounts/${id}/rooms`).array()).map((room) =>
  parseObject(room, password, true)
);

let messageStream;
function RoomIcon({
  room,
  icon,
  onclick = () => {
    messageStream.close?.();
    const closeEvent = {};
    messageStream.replaceWith(
      (messageStream = (
        <MessageStream
          id={room.roomID}
          key={room.key}
          closeEvent={closeEvent}
          author={id}
        />
      ))
    );
    messageStream.close = closeEvent.close;
  },
  invite = false,
  renderLastMessage = true,
}) {
  return (
    <button onclick={onclick} class="flex gap-3 m-1 h-16 w-full">
      <div
        class={`w-16 h-16 rounded-full center text-white text-2xl basis-16 ${
          invite ? "border border-[var(--color)]" : "blue-bg"
        }`}
      >
        {icon ?? room.name.match(/(?<=^| )(.)/g).join("")}
      </div>
      <div class="grow">
        <h2 class="text-left font-semibold mb-1">{room.name}</h2>
        <p class="bg-[#0001] p-1 rounded w-2/3 h-[1rem] mb-1"></p>
        <p class="bg-[#0001] p-1 rounded w-2/5 h-[1rem]"></p>
      </div>
    </button>
  );
}

let addRoomButton;
new EventSource(
  `https://${firebaseName}-default-rtdb.firebaseio.com/accounts/${id}/invite.json`
).addEventListener("put", async ({ data }) => {
  const { data: room } = JSON.parse(data);
  if (!room) return;
  addRoomButton?.parentElement.append(
    <RoomIcon
      room={{
        name: (
          <span>
            <span class="blue-bg px-3 rounded-full text-white">
              Invited to:
            </span>{" "}
            {parse(
              await firebase.get(`rooms/${room.id}/name`),
              room.key
            ).toParsed()}
          </span>
        ),
      }}
      icon={<img src="https://img.icons8.com/ios/25/0c0b2e/alarm--v1.png" />}
      invite={true}
      renderLastMessage={false}
      onclick={async function () {
        this.remove();
        const roomData = { roomID: room.id, key: room.key };
        await firebase.post(
          `accounts/${id}/rooms`,
          parseObject({ roomID: room.id, key: room.key }, password)
        );
        const icon = (
          <RoomIcon
            room={{
              ...roomData,
              ...parseObject(
                await firebase.get(`rooms/${roomData.roomID}`),
                roomData.key,
                true
              ),
            }}
          />
        );
        addRoomButton.parentElement.insertBefore(icon, addRoomButton);
        icon.click();
      }}
    />
  );
});

export default (
  <main class="w-screen h-screen grid grid-flow-col grid-cols-[3fr,5fr]">
    <div class="w-full h-full glass-bg box-border p-5 pt-14 flex flex-col gap-3 relative">
      <style jsx>{`
        .glass-bg {
          background: radial-gradient(
              at 30% 30%,
              var(--color),
              var(--color-light)
            )
            #fffd;
          background-blend-mode: overlay;
        }

        .blue-bg {
          background: linear-gradient(30deg, var(--color), var(--color-light));
        }
      `}</style>
      <nav class="absolute h-9 w-full shadow left-0 top-0 center grid-flow-col">
        <h2 class="w-full text-left ml-5 font-semibold">{username}</h2>
        <div class="w-full flex justify-end">
          <button
            class="p-1 px-3 mr-1 blue-bg rounded-full text-sm text-white"
            onclick={() => {
              localStorage.setItem("account", "{}");
              location = "./";
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      {await Promise.all(
        rooms.map(async (room) => (
          <RoomIcon
            room={{
              ...room,
              ...parseObject(
                await firebase.get(`rooms/${room.roomID}`),
                room.key,
                true
              ),
            }}
          />
        ))
      )}
      {
        (addRoomButton = (
          <RoomIcon
            room={{ name: "Create New Room" }}
            icon={
              <img src="https://img.icons8.com/ios-glyphs/24/ffffff/create-new.png" />
            }
            renderLastMessage={false}
            onclick={async function () {
              const key = crypto.randomUUID();
              const name = prompt("What is the name of your new room?");
              const { name: roomID } = await firebase.post(
                "rooms",
                parseObject({ name }, key)
              );
              await firebase.post(
                `accounts/${id}/rooms`,
                parseObject({ key, roomID, type: "room" }, password)
              );
              this.parentElement.insertBefore(
                <RoomIcon room={{ name, key, roomID }} />,
                this
              );
            }}
          />
        ))
      }
    </div>
    <div class="w-full h-full">
      {
        (messageStream = (
          <p class="w-full h-full center text-gray-300">
            You don't have any rooms selected
          </p>
        ))
      }
    </div>
  </main>
);
