randInt = function (range, start) {
	return Math.floor(Math.random() * range) + (start || 0);
}

waitabit = function (time, ...args) {
	return new Promise(resolve => setTimeout(resolve, time, ...args));
}

for (let i = 0; i < sessionStorage.length;) {
	let key = sessionStorage.key(i);
	if (/loadPageAsTemplate:/m.test(key)) {
		sessionStorage.removeItem(key);
	}
	else ++i;
}

getAutosize = function () {
	return new Promise((resolve, reject) => {
		if (this.loaded) return resolve();
		const script = document.createElement('script');
		script.src = 'static/autosize.js';
		script.onload = _ => {
			this.loaded = true;
			resolve();
		};
		document.head.appendChild(script);
	});
}.bind({
	loaded: false
});

loadPageAsTemplate = async function (url) {
	const key = `loadPageAsTemplate:${url}`
	let responseText;
	let cached = sessionStorage.getItem(key);
	if (cached) {
		responseText = cached;
	}
	else {
		let response = await fetch(url);
		responseText = await response.text();
		try {
			sessionStorage.setItem(key, responseText);
		}
		finally {};
	}
	let tmpl = document.createElement('template');
	tmpl.innerHTML = responseText;
	return tmpl;
}

flatten = (acc, arr) => arr ? acc.concat(arr) : (acc ? acc : []);

function populateDateSelectors() {
	const newEntryText = 'New Entry';

	function generateSelector(elem) {
		let containers = (function () {
			let ret = null;
			let selector = null;
			let root = null;

			// check tags for info
			if (elem.hasAttribute('container-selector')) {
				selector = elem.getAttribute('container-selector');
			}
			if (elem.hasAttribute('parent-level')) {
				let n = Number(elem.getAttribute('parent-level'));
				root = elem;
				while (n-- > 0) {
					root = root.parentElement;
				}
			}

			// select containers
			if (selector) {
				root = root || document;
				ret = Array.from(root.querySelectorAll(selector));
			}
			else {
				root = root || elem.parentElement;
				ret = [root];
			}

			return ret;
		})();
		elem.innerHTML =
			`
			<select class="form-control">
				<option>2015-07-21</option>
				<option>2016-01-24</option>
				<option>2017-09-23</option>
				<option selected="selected">2018-08-26</option>
				<option>${newEntryText}</option>
			</select>
		`;

		elem.classList.add('pull-right');
		elem.style.transform += 'translateY(-4px)';

		let select = elem.firstElementChild;

		let getControls = function () {
			// get list of controls
			let controls =
				containers.map(c => Array.from(c.querySelectorAll('input, select, textarea, button, div.btn')))
				.reduce(flatten)
				.filter(x => x != select); // make sure we don't disable ourselves
			return controls;
		}

		// sample data regex
		const regex = /Sample input on \d+-\d+-\d+/;

		let showOldData = function (date) {
			let controls = getControls();

			// populate with default data for controls
			// note: this needs to be done before disabling to dispatch the onchange events
			controls.forEach(c => {
				const type = c.getAttribute('type') || c.type;
				// numbers
				if (c.tagName === 'INPUT' && type == 'number') {
					c.value = randInt(100);
				}
				// text
				else if (c.tagName === 'TEXTAREA' || (c.tagName === 'INPUT' && type == 'text')) {
					if (regex.test(c.value) || c.value === '' || typeof c.value === 'undefined')
						c.value = `Sample input on ${date}`;
				}
				// dropdown
				else if (c.tagName === 'SELECT') {
					// select random option
					let option = randInt(c.childElementCount);
					c.selectedIndex = option;
				}
				// date
				else if (c.tagName === 'INPUT' && type === 'date') {
					c.value = date;
				}
				// time
				else if (c.tagName === 'INPUT' && type === 'time') {
					let date = new Date(0, 0, 0, randInt(24), randInt(60), randInt(60));
					c.value = date.toISOString().slice(-13, -5);
				}
				// checkbox
				else if (c.tagName === 'INPUT' && type === 'checkbox') {
					c.checked = Math.random() >= 0.5;
				}

				c.disabled = false;
			});

			// dispatch event and enable controls
			waitabit().then(_ => {
				controls.forEach(c => {
					c.dispatchEvent(new Event('change'));
					c.disabled = true;
				});
			});
		}

		let onchange = function (e) {
			let val = select.value;
			if (val === newEntryText) {
				let controls = getControls();
				controls.forEach(e => {
					e.disabled = false;
				});
			}
			else {
				showOldData(val);
			}
		}

		elem.addEventListener('change', onchange);
		elem.addEventListener('click', e => e.preventDefault());
		onchange();
	}
	Array.from(document.querySelectorAll('date-selector'))
		.filter(elem => elem.childElementCount === 0)
		.forEach(generateSelector);
}

async function populateRemarks(force) {
	let loadingAutosize = getAutosize();
	const onchange = function () {
		let ta = document.getElementById(remarkId);
		let option = select.value;
		if (option !== "New Remark") {
			ta.value = `Sample remark on ${option}`;
			ta.disabled = true;
		}
		else {
			ta.value = "";
			ta.disabled = false;
		}
	};

	const template = await loadPageAsTemplate('ajax/templates/remark.html');
	const label = template.content.querySelector('label');
	const select = template.content.querySelector('select');
	const ta = template.content.querySelector('textarea');

	async function generateRemarks(elem) {
		const remarkName = elem.getAttribute('remark');
		const remarkId = 'remark' + '-' + remarkName.replace(/ /g, '-');
		const remarkText = elem.getAttribute('remark-label');
		label.for = remarkId;

		// force rerender
		if (force) elem.innerHTML = "";

		if (elem.hasAttribute('remark-label')) {
			label.textContent = `${elem.getAttribute('remark-label')} Remark`;
		}
		else {
			label.textContent = "Remark";
		}

		if (elem.hasAttribute('date-selector')) {
			select.name = `${remarkId}-date`;
			select.id = `${remarkId}-date`;
		}
		else {
			select.remove();
		}

		ta.id = remarkId;
		ta.name = remarkId;

		elem.appendChild(document.importNode(template.content, true));

		// the following code operates on the duplicated element

		if (elem.hasAttribute('date-selector')) {
			const select = elem.querySelector('select');
			select.addEventListener('change', onchange);
			onchange();
		}

		await loadingAutosize;
		autosize(elem.querySelector('textarea'));

	}


	Array.from(document.querySelectorAll('[remark]'))
		.filter(elem => force || elem.childElementCount === 0)
		.forEach(generateRemarks);
}

function populateEffectiveDates() {
	const attribute = 'effective-date';

	function generateEffectiveDate(elem) {
		let dateId = attribute + '-' + elem.getAttribute(attribute).replace(/ /g, '-');
		let labelText = (function () {
			if (!elem.hasAttribute('label'))
				return '';
			else {
				let label = elem.getAttribute('label');
				if (!label || label.length == 0) {
					return elem.getAttribute(attribute);
				}
			}
		})();
		let required = !elem.hasAttribute('optional');
		elem.innerHTML = `
<label for="" class="control-label col-sm-4 ${required ? 'required' : ''}">${labelText ? labelText + ' ' : ''}Effective Date</label>
<div class="col-sm-8">
	<label for="${dateId}-date" style="display: inline;"> </label>
	<input style="display:inline;" class="form-control" type="date" id="${dateId}-date" name="${dateId}-date" data-rule-dateISO="true" placeholder="YYYY-MM-DD" ${required ? 'required="required"' : ""}/>
	<label for="${dateId}-time" style="display: inline;"></label>
	<input style="display:inline;" class="form-control" type="time" id="${dateId}-time" name="${dateId}-time" placeholder="hh:mm:ss"  ${required ? 'required="required"' : ""}/>
</div>
`;
		//console.log(
		$(elem).find('input[type="date"]').trigger('wb-init.wb-date')
			//);
	}

	Array.from(document.querySelectorAll(`[${attribute}]`))
		.filter(elem => elem.childElementCount === 0)
		.forEach(generateEffectiveDate);
}

let populateHistoryTabs = (async function () {
	const template = await loadPageAsTemplate('ajax/templates/history-tab.html');
	let slots = Array.from(template.content.querySelectorAll('child-content') || []);

	function generateTab(elem) {
		// init variables
		slots.forEach(s => (s.innerHTML = elem.innerHTML));
		let clone = document.importNode(template.content, true);
		let arr = Array.from(clone.children);
		elem.parentElement.replaceChild(clone, elem);
		return arr;
	}

	Array.from(document.querySelectorAll('history-tab, template[history-tab]'))
		// generates tab and returns the children
		.map(generateTab)
		// flatten to single array
		.reduce(flatten, [])
		// populate custom elements
		// .map(e => populateCustomElems() || e) // not needed since the other things get populated after we finish generating
		// wait a bit and initialize tabs. Delay on first trigger must be at least 1s to account for $ initialization
		.map(async e => {
			this.first = typeof this.first == "undefined";
			// note: if !this.first this.waiting cannot be changed, so this if statement is required
			if (this.first) {
				this.waiting = true;
			}
			let result = await waitabit(this.waiting ? 1000 : 0);
			$(e).trigger('wb-init.wb-tabs');
			populateCustomElems(true);
			this.waiting = false;
		});
}).bind({});


async function setPageHeader() {
	const template = await loadPageAsTemplate('ajax/templates/update-page-header.html');
	const title = template.content.querySelector('h1');
	Array.from(document.querySelectorAll('[property="name"]'))
		.forEach(e => {
			const match = /(\w+) (.*) - .*$/.exec(document.title);
			title.textContent = `${match[2]}`;
			e.parentElement.replaceChild(template.content.cloneNode(true), e);
		});
}

populateCustomElems = async function (force) {
	populateHistoryTabs();
	populateRemarks(force);
	populateEffectiveDates(force);
	//	populateDateSelectors();
};

// generate remark elements
window.addEventListener('load', function () {
	setPageHeader();
	$(document).on('wb-ready.wb', populateCustomElems);
})
