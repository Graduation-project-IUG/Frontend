
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("profile-form");
  const editBtn = document.getElementById("editProfileBtn");
  const inputs = form ? form.querySelectorAll("input, textarea") : [];
  let editing = false;

  function setEditing(value) {
    editing = value;
    inputs.forEach((input) => {
      input.disabled = !value;
      input.classList.toggle("bg-gray", !value);
    });
    editBtn.textContent = value ? "حفظ البيانات" : "تعديل البيانات";
  }

  function fillProfile(user) {
    if (!user) return;
    document.getElementById("profileName").textContent = user.full_name || "المستخدم";
    document.getElementById("profileCity").textContent = user.city || "—";
    document.getElementById("statCity").textContent = user.city || "—";
    form.full_name.value = user.full_name || "";
    form.email.value = user.email || "";
    form.phone.value = user.phone || "";
    form.birthdate.value = user.birthdate ? String(user.birthdate).slice(0, 10) : "";
    form.city.value = user.city || "";
    form.bio.value = user.bio || "";
  }

  try {
    const user = await MultaqaAPI.apiFetch("/user/profile");
    fillProfile(user);
  } catch (error) {
    MultaqaAPI.notify("تعذر تحميل بيانات الملف الشخصي", "error");
  }

  setEditing(false);

  editBtn?.addEventListener("click", async () => {
    if (!editing) {
      setEditing(true);
      return;
    }

    const body = Object.fromEntries(new FormData(form).entries());
    try {
      editBtn.disabled = true;
      const updated = await MultaqaAPI.apiFetch("/user/profile", { method: "PUT", body });
      fillProfile(updated || body);
      setEditing(false);
      MultaqaAPI.notify("تم حفظ البيانات بنجاح");
    } catch (error) {
      MultaqaAPI.notify("زر الحفظ مربوط بواجهة: PUT /user/profile. أضفها للـbackend حتى يكتمل الحفظ.", "error");
    } finally {
      editBtn.disabled = false;
    }
  });
});

