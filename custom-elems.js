const WetReadyPromise = new Promise((resolve, reject) => {
	$(document).on('wb-ready.wb', e => {
		resolve(e);
	})
});

browser = function () {
	// Return cached result if avalible, else get result then cache it.
	if (browser.prototype._cachedResult)
		return browser.prototype._cachedResult;

	// Opera 8.0+
	var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

	// Firefox 1.0+
	var isFirefox = typeof InstallTrigger !== 'undefined';

	// Safari 3.0+ "[object HTMLElementConstructor]" 
	var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
		return p.toString() === "[object SafariRemoteNotification]";
	})(!window['safari'] || safari.pushNotification);

	// Internet Explorer 6-11
	var isIE = /*@cc_on!@*/ false || !!document.documentMode;

	// Edge 20+
	var isEdge = !isIE && !!window.StyleMedia;

	// Chrome 1+
	var isChrome = !!window.chrome && !!window.chrome.webstore;

	// Blink engine detection
	var isBlink = (isChrome || isOpera) && !!window.CSS;

	return browser.prototype._cachedResult =
		isOpera ? 'Opera' :
		isFirefox ? 'Firefox' :
		isSafari ? 'Safari' :
		isChrome ? 'Chrome' :
		isIE ? 'IE' :
		isEdge ? 'Edge' :
		"Don't know";
};

defer = function () {
	let resolve, reject;
	let promise = new Promise((a, b) => {
		resolve = a;
		reject = b;
	});
	promise.resolve = resolve;
	promise.reject = reject;
	return promise;
}

randInt = function (range, start = 0) {
	return Math.floor(Math.random() * range) + start;
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

		if (false && elem.hasAttribute('date-selector')) {
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

		if (false && elem.hasAttribute('date-selector')) {
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
		populateEffectiveDates.counter = populateEffectiveDates.counter || 0;
		populateEffectiveDates.counter += 1;
		let dateId = attribute + '-' + elem.getAttribute(attribute).replace(/ /g, '-') + populateEffectiveDates.counter;
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
<label for="" class="control-label col-sm-4 ${required ? 'required' : ''}">${labelText ? labelText + ' ' : ''}Effective Date<br>(YYYY-MM-DD HH:MM:SS)</label>
<div class="col-sm-8">
	<label for="${dateId}-date" style="display: inline;"> </label>
	<input style="display:inline;" class="form-control" type="date" id="${dateId}-date" name="${dateId}-date" data-rule-dateISO="true" placeholder="YYYY-MM-DD" ${required ? 'required="required"' : ""}/>
	<label for="${dateId}-time" style="display: inline;"></label>
	<input style="display:inline;" class="form-control" type="time" id="${dateId}-time" name="${dateId}-time" placeholder="hh:mm:ss"  ${required ? 'required="required"' : ""}/>
</div>
`;
		return document.getElementById(`${dateId}-date`);
	}

	const generatedElems = Array.from(document.querySelectorAll(`[${attribute}]`))
		.filter(elem => elem.childElementCount === 0)
		.map(generateEffectiveDate);
	waitabit().then(_ => {
		$(`input[type="date"]`).trigger('wb-init.wb-date');
	});
};

let populateHistoryTabs = (async function () {
	let templatePromise = this.template || loadPageAsTemplate('ajax/templates/history-tab.html');
	let templateRow = this.templateRow || loadPageAsTemplate('ajax/templates/history-table-row.html');

	function generateTable(table, slot) {
		const template = templateRow;
		let rowList = template.content.children;
		const count = randInt(10, 2);
		const groups = Array.from(slot.querySelectorAll('.form-group'));
		const tbody = table.querySelector('tbody');
		tbody.querySelectorAll('tr.generated').forEach(x => x.remove());

		let userTable = slot.querySelector('historical-table,template[historical-table]');

		if (userTable) {
			userTable = slot.removeChild(userTable);
			if (userTable.tagName === "TEMPLATE")
				userTable = userTable.content;
			for (let row of userTable.querySelectorAll('tr')) {
				row.classList.add('generated');
				tbody.appendChild(row);
			}
		}
		else {
			for (let i = 0; i < count; ++i) {
				// autogenerate some name value changes
				let data = groups
					.map(group => {
						const label = group.querySelector('label');
						if (!label) return;
						const input = group.querySelector('input, select, textarea');
						if (!input) return;
						let name = label.textContent;
						let value;
						if (input.tagName === "SELECT") {
							const option = input.options[randInt(input.options.length)];
							if (!option)
								return;
							value = option.textContent || option.value;
						}
						else if (input.type === "checkbox") {
							const values = [...group.querySelectorAll('input[type="checkbox"]')].map(e => e.value).filter(_ => Math.random() < .5);
							value = values.join(', ') || "None";
						}
						else {
							value = `Sample data ${randInt(100)}`;
						}
						return {
							name,
							value
						};
					})
					.filter(x => x)
					.filter(_ => Math.random() < .30) // only change like 30% of the stuff
				;
				if (data.length == 0) {
					continue;
				}
				// entered date
				const date =
					new Date(946684800000 + randInt(Date.now() - 946684800000));
				rowList[0].textContent = date
					.toISOString()
					.replace(/T|\.\d+Z$/g, " ")
					.trim();
				date.setTime(date.getTime() + (Math.random() < .80 ? 0 : randInt(4 * 24 * 60 * 60 * 1000)));
				rowList[1].textContent = date
					.toISOString()
					.replace(/T|\.\d+Z$/g, " ")
					.trim();
				// user
				rowList[2].textContent = `John Doe (DCS)`;

				// changes
				rowList[3].innerHTML = "";
				data.map(({
					name,
					value
				} = {}) => {
					const block = document.createElement('div');
					const n = document.createElement('strong');
					n.textContent = name;
					block.appendChild(n);
					const v = document.createElement('span');
					v.textContent = `: ${value}`;
					block.appendChild(v);
					return block;
				}).forEach(block => {
					rowList[3].appendChild(block);
				});
				// remark
				rowList[4].textContent =
					data
					.map(({
						name,
						value
					} = {}) => {
						let roll = Math.random();
						if (roll < .3) {
							return `Changed ${name}`;
						}
						else if (roll < .6) {
							return `Set ${name} to ${value} as a test`;
						}
						else {
							return ``;
						}
					}).filter(x => x).join('. ') || "Made some changes...";

				let row = document.createElement('tr');
				row.classList.add('generated')
				row.appendChild(document.importNode(template.content, true));
				tbody.appendChild(row);
			}
		}
	}

	async function generateTab(elem) {
		elem.setAttribute('generated', "");
		const template = await templatePromise;
		const slot = template.content.querySelector('child-content');
		const table = template.content.querySelector('generated > table');
		const parent = elem.parentElement;
		const domChangeFinishedPromise = defer();

		templateRow = await templateRow;

		slot.innerHTML = elem.innerHTML;
		generateTable(table, slot);

		let clone = document.importNode(template.content, true);

		parent.replaceChild(clone, elem);

		$(parent).find('table').on('wb-ready.wb-tables', evt => {
			$(parent).find('.wb-tabs').on('wb-ready.wb-tabs', _ => {
				domChangeFinishedPromise.resolve(parent.children);
			}).trigger('wb-init.wb-tabs');
		}).trigger('wb-init.wb-tables');

		return domChangeFinishedPromise;
	}

	const generatedElems =
		Promise.all(
			Array.from(document.querySelectorAll('history-tab, template[history-tab]'))
			// ignore elements with generated attribute
			.filter(e => !e.hasAttribute('generated'))
			// generates tab and returns a promise that resolves with the children
			.map(generateTab)
		).then(e => e.reduce(flatten, []));

	return generatedElems;
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
	await WetReadyPromise;
	await populateHistoryTabs();
	populateRemarks(force);
	populateEffectiveDates(force);
	//	populateDateSelectors();
};

// generate remark elements
window.addEventListener('load', function () {
	setPageHeader();
	populateCustomElems();
})
