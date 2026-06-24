document.addEventListener("DOMContentLoaded", async () => {
  const id = MultaqaAPI.getParam("id");
  const form = document.getElementById("edit-post-form");
  if (!id) {
    document.getElementById("editPostStatus").innerHTML = "<div class='empty-state'>لم يتم تحديد رقم المنشور.</div>";
    form.style.display = "none";
    return;
  }

  try {
    const post = await MultaqaAPI.apiFetch(`/post/${id}`);
    form.title.value = post.title || "";
    form.category.value = post.category || "";
    form.description.value = post.description || "";
  } catch (error) {
    document.getElementById("editPostStatus").innerHTML = "<div class='empty-state'>تعذر تحميل المنشور.</div>";
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    try {
      submitButton.disabled = true;
      await MultaqaAPI.apiFetch(`/post/${id}`, {
        method: "PUT",
        body: {
          title: formData.get("title"),
          category: formData.get("category"),
          description: formData.get("description") || undefined,
        },
      });
      MultaqaAPI.notify("تم تحديث المنشور");
      window.location.href = `/pages/post.html?id=${id}`;
    } catch (error) {
      MultaqaAPI.notify(error.message || "تعذر تحديث المنشور", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
