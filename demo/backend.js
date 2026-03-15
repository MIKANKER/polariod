const file = document.querySelector("#file");
const template = document.querySelector("#template");
const optionsEl = document.querySelector("#options");
const run = document.querySelector("#run");
const out = document.querySelector("#out");
const status = document.querySelector("#status");

async function post() {
  const f = file.files?.[0];
  if (!f) {
    status.textContent = "Selecciona una imagen";
    return;
  }

  let options;
  try {
    options = JSON.parse(optionsEl.value);
  } catch (e) {
    status.textContent = `options JSON inválido: ${String(e?.message || e)}`;
    return;
  }

  const form = new FormData();
  form.append("image", f);
  if (template.files?.[0]) form.append("template", template.files[0]);
  form.append("options", JSON.stringify(options));

  status.textContent = "Procesando...";
  out.removeAttribute("src");

  const res = await fetch("http://localhost:8000/api/render", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text();
    status.textContent = `Error ${res.status}: ${txt}`;
    return;
  }

  const blob = await res.blob();
  out.src = URL.createObjectURL(blob);
  status.textContent = `OK (${blob.type}, ${Math.round(blob.size / 1024)} KB)`;
}

run.addEventListener("click", () => void post());