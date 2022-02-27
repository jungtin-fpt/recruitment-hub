import * as bootstrap from 'bootstrap';
export const showToast = function (toastContainerEl, message, bgClass) {
	const id = makeId(4);
	const template = `<div class="toast bg-${bgClass} text-white" data-id="${id}" data-bs-autohide="true" data-bs-delay="5000" role="alert" aria-live="assertive"
                                aria-atomic="true">
                            <div class="toast-header">
                                <strong class="me-auto">Crawler Notification</strong>
                                <small class="text-muted">just now</small>
                                <button type="button"
                                        class="btn-close"
                                        data-bs-dismiss="toast"
                                        aria-label="Close"></button>
                            </div>
                            <div class="toast-body">${message}</div>
                        </div>`;
	toastContainerEl.insertAdjacentHTML('beforeend', template);
	const toast = new bootstrap.Toast(document.querySelector(`.toast[data-id='${id}']`));
	toast.show();
};

function makeId(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
