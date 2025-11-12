document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addQuestionBtn');
  const container = document.getElementById('questions-container');

  if (!addBtn || !container) return; // guard

  let count = 0;

  addBtn.addEventListener('click', () => {
    count++;
    const block = document.createElement('div');
    block.classList.add('border', 'p-3', 'mb-3', 'rounded');
    block.innerHTML = `
      <h6>Question ${count}</h6>
      <div class="mb-2">
        <label>Question Text</label>
        <input type="text" name="questions[${count - 1}][question]" class="form-control" required>
      </div>
      <div class="mb-2">
        <label>Option A</label>
        <input type="text" name="questions[${count - 1}][options][]" class="form-control" required>
      </div>
      <div class="mb-2">
        <label>Option B</label>
        <input type="text" name="questions[${count - 1}][options][]" class="form-control" required>
      </div>
      <div class="mb-2">
        <label>Option C</label>
        <input type="text" name="questions[${count - 1}][options][]" class="form-control">
      </div>
      <div class="mb-2">
        <label>Option D</label>
        <input type="text" name="questions[${count - 1}][options][]" class="form-control">
      </div>
      <div class="mb-2">
        <label>Correct Answer</label>
        <input type="text" name="questions[${count - 1}][answer]" class="form-control" required>
      </div>
    `;
    container.appendChild(block);
  });
});
