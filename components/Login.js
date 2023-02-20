import firebase, { parse } from "firebase.js";

let title;

function Nav() {
  function changeTitle() {
    title.innerHTML = this.innerHTML;
  }

  return (
    <>
      <style jsx>{`
        input[type="radio"]:checked + label::after {
          content: "";
          position: absolute;
          bottom: -10px;

          width: 150%;
          height: 4px;
          border-radius: 4px;

          background: white;
          left: 50%;
          transform: translateX(-50%);
        }
      `}</style>
      <nav class="center grid-flow-col basis-16 [&>*]:relative">
        <input
          type="radio"
          name="method"
          value="signup"
          id="signup"
          checked
          class="hidden"
        />
        <label for="signup" onclick={changeTitle}>
          SignUp
        </label>
        <input
          type="radio"
          name="method"
          value="login"
          id="login"
          class="hidden"
        />
        <label for="login" onclick={changeTitle}>
          Login
        </label>
      </nav>
    </>
  );
}

function Input({ name, placeholder, type = "text" }) {
  return (
    <input
      class="px-8 py-3 text-[var(--color)] outline-none rounded shadow w-3/5"
      name={name}
      placeholder={placeholder}
      type={type}
    />
  );
}

export default (
  <>
    <div class="box-border p-5 w-full h-full text-white">
      <form
        class="w-full h-full bg-[linear-gradient(30deg,var(--color),var(--color-light))] rounded shadow flex flex-col"
        onsubmit={async function (ev) {
          ev.preventDefault();

          if (this.method.value == "signup") {
            const username = this.username.value;
            const password = parse(
              parse(this.password.value, username),
              this.password.value
            );

            if (
              (await firebase.get("accounts").array()).some(
                (account) => account.username == username
              )
            ) {
              alert("There is already an account with that name");
              return;
            }

            const { name: id } = await firebase.post("accounts", {
              username,
              password,
            });
            localStorage.setItem(
              "account",
              JSON.stringify({ id, username, password: this.password.value })
            );
            location = "app.html";
            return;
          }

          if (this.method.value == "login") {
            const account = (await firebase.get("accounts").array()).find(
              (account) =>
                account.username == this.username.value &&
                account.password.toParsed() ==
                  parse(
                    parse(this.password.value, this.username.value),
                    this.password.value
                  ).toParsed()
            );
            if (!account) {
              alert("Incorret username or password");
              return;
            }

            localStorage.setItem(
              "account",
              JSON.stringify({
                username: account.username,
                password: this.password.value,
                id: account.id,
              })
            );
            location = "app.html";
          }
        }}
      >
        <Nav />
        <div class="grow-[5] center">
          <div class="center gap-5 w-full">
            {(title = <h1 class="text-3xl font-bold">SignUp</h1>)}
            <Input name="username" placeholder="Username" />
            <Input name="password" type="password" placeholder="Password" />
          </div>
        </div>
        <div class="grow-[2] center w-full">
          <button
            type="submit"
            class="bg-white px-8 py-3 text-[var(--color)] rounded shadow w-3/5"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  </>
);
