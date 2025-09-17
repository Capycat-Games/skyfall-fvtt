
export default class SkyfallMigrationHelper {
	
	static async migrate(options = {packs: false}) {
		
		// , options = {actors:true, itens:true, scenes:true, packs:false}, options = {actors:true, itens:true, scenes:true, packs:false}
		const currentVersion = game.settings.get('skyfall','systemMigrationVersion');
		const migrations = Object.entries(SkyfallMigrationHelper.migrations()) ;
		const notifyLabel = "Migrating World Document. Applying v{version}";
		const progressBar = ui.notifications.notify("Migrating World Document.", "info", {
			localize: true,
			progress: true,
			pct: 0
		});

		let acc = 0;
		for (const [version, migrationTransformations] of migrations) {
			acc++;
			if ( !foundry.utils.isNewerVersion( version, currentVersion ) ) continue;
			console.groupCollapsed(`migration: v${version}`);
			try {
				ui.notifications.update(progressBar, {
					message: game.i18n.format(notifyLabel, version),
					pct: ((acc / migrations.length) * 100).toFixed(0)
				});
				const transformations = migrationTransformations;
				for (const data of Object.values(transformations)) {
					console.log(transformations, data);
					if ( data.actor ) {
						const {transformation, condition} = data.actor;
						await game.actors.updateAll(transformation, condition);
	
						if ( options.packs ) {
							const packs = game.packs.filter( i => i.documentName == 'Actor');
							for (const pack of packs) {
								const wasLocked = pack.locked;
								await pack.configure({locked: false});
								await pack.updateAll(transformation, condition);
								await pack.configure({locked: wasLocked});
							}
						}
					}
					if ( data.item ) {
						const {transformation, condition} = data.item;
						await game.items.updateAll(transformation, condition);
						
						// Check if packages should be migrated
						if ( options.packs ) {
							const packs = game.packs.filter( i => i.documentName == 'Item');
							for (const pack of packs) {
								const wasLocked = pack.locked;
								await pack.configure({locked: false});
								await pack.updateAll(transformation, condition);
								await pack.configure({locked: wasLocked});
							}
						}
					}
				}
				await game.settings.set('skyfall','systemMigrationVersion', version);
				ui.notifications.info(`Migrated to ${version}`, {permanent: true})
			} catch (error) {
				console.error(error);
			}
			console.groupEnd();
		}
		ui.notifications.update(progressBar, {
			message: "Migrating World Document.",
			pct: 1
		});
	}

	static migrations() {
		return {
			"0.9.600": SkyfallMigrationHelper.migratev09600(),
		}
	}

	/* -------------------------------------------------- */
	/* Version 0.9.600                                    */
	/* -------------------------------------------------- */

	static migratev09600() {
		return {
			uniqueDescription: {
				item: {
					transformation: SkyfallMigrationHelper.uniqueDescription,
					condition: (doc) => ['ability','spell'].includes(doc.type),
				},
				actor: {
					transformation: SkyfallMigrationHelper.uniqueDescriptionEmbedded,
					condition: (doc) => {
						console.log(doc.name, doc.items);
						return doc.items.some( i => ['ability','spell'].includes(i.type))
					},
				}
			},
			itemRolls: {
				item: {
					transformation: SkyfallMigrationHelper.itemRolls,
					condition: (doc) => doc.system.attack || doc.system.damage,
				},
				actor: {
					transformation: SkyfallMigrationHelper.itemRollsEmbedded,
					condition: (doc) => doc.items.some( i => i.system.attack || i.system.damage),
				}
			},
		}
	}

	static uniqueDescription(doc) {
		console.groupCollapsed('itemRolls');
		console.log(doc);
		let finalDesc = '';
		let flavor = '';
		try {
			const itemDesc = {};
			itemDesc.hit = doc.system.attack.hit;
			itemDesc.miss = doc.system.attack.miss;
			itemDesc.effect = doc.system.effect.descriptive;
			itemDesc.special = doc.system.special.descriptive;
			const labels = {
				hit: "<b>Acerto:</b> ",
				miss: "<b>Erro:</b> ",
				effect: "<b>Efeito:</b> ",
				special: "<b>Especial:</b> ",
			};
			
			for (let [key, text] of Object.entries(itemDesc) ) {
				let div = document.createElement('div');
				let label = document.createElement('label');
				label.innerText = labels[key];
				div.innerHTML = text;
				const p = div.querySelector('p');
				if ( p ) {
					p.innerHTML = labels[key] + p.innerHTML;
					// p.prepend(label);
				}
				finalDesc += div.innerHTML;
			}
			flavor = doc.system.description.value;
		} catch (error) {
			
		}
		const updateData = {};
		updateData['system.description.value'] = finalDesc;
		updateData['system.description.flavor'] = flavor;
		console.log(updateData);
		console.groupEnd();
		return updateData;
	}
	
	static uniqueDescriptionEmbedded(doc) {
		console.groupCollapsed(`uniqueDescriptionEmbedded ${doc.name}`);
		const items = doc.items.filter( i => ['ability','spell'].includes(i.type) );
		console.log(doc);
		console.log(items);
		if ( !items ) {
			console.groupEnd();
			return {};
		};
		const itemUpdates = [];
		for (const item of items) {
			console.log(this);
			const update = SkyfallMigrationHelper.uniqueDescription(item);
			update['_id'] = item.id;
			update['id'] = item.id;
			itemUpdates.push(update);
		}
		const updateData = {};
		updateData['items'] = itemUpdates;
		console.log(updateData);
		console.groupEnd();
		return updateData;
	}

	static itemRolls(doc) {
		console.groupCollapsed('itemRolls');
		console.log(doc);
		const rolls = {};
		try {
			const descriptors = new Set(doc.system.descriptors);
			if( ['weapon', 'armor'].includes(doc.type)  ) {
				// ATTACK
				if ( doc.system.attack ) {
					const {ability, bonus} = doc.system.attack;
					const id = randomID(16);
					const r = { label: 'Ataque', type: 'attack', terms: [] };
					r.terms.push({
						expression: `@${ability ?? 'str'}`, flavor: '', data: 'ability', source: 'weapon',
					}, {
						expression: `@proficiency`, flavor: '', data: '', source: 'proficiency',
					});
					if ( bonus ) {
						r.terms.push({
							expression: bonus, flavor: '', data: '', source: '',
						});
					}
					
					rolls[id] = r;
				}
	
				// DAMAGE;
				if ( doc.system.damage ) {
					const {die, versatile, ability, bonus} = doc.system.damage;
					const id = randomID(16);
					const r = { label: 'Dano', type: 'damage', terms: [] };
					r.terms.push({expression: die, flavor: '', data: '', source: 'weapon'});
					r.terms.push({
						expression: `@${(ability ? ability : 'str')}`,
						flavor: '', data: 'ability', source: ''
					});
					if ( bonus ) {
						r.terms.push(
							{expression: bonus, flavor: '', data: '', source: ''},
						);
					}
					rolls[id] = r;
					if ( descriptors.has('versatile') && versatile) {
						const id = randomID(16);
						const rv = { ...r, label: 'Dano Versátil'};
						rv.terms[0].expression = versatile;
						rolls[id] = rv;
					}
				}
			}
			if( ['consumable'].includes(doc.type) ) {
				const {formula} = doc.system.damage;
				const id = randomID(16);
				const r = { label: 'Dano', type: 'damage', terms: [] };
				r.terms.push({
					expression: formula, flavor: '', data: '', source: 'consumable',
				});
				rolls[id] = r;
			}
			
			if( ['ability','spell'].includes(doc.type) ) {
				const isWeaponAttack = descriptors.has('attack') && descriptors.has('wapon');
				const isSpellAttack = descriptors.has('attack') && descriptors.has('magical');
				
				if ( doc.system.attack?.ability && doc.system.attack?.protection ) {
					const {ability, protection} = doc.system.attack;
					const id = randomID(16);
					const r = { label: 'Ataque', type: 'attack', terms: [], protection };
					
					let expression = `@${ability}`;
					if ( isSpellAttack ) expression = '@magic';
					else if ( isWeaponAttack ) expression = '@weapon';
	
					r.terms.push({
						expression: expression, flavor: '', data: '', source: '',
					});
					rolls[id] = r;
				}
				if ( doc.system.attack?.damage ) {
					const {damage} = doc.system.attack;
					const id = randomID(16);
					const r = { label: 'Dano', type: 'damage', terms: [] };
					r.terms = damage.split(/\+|-/g).map( t => ({
						expression: t.trim(), flavor: '', data: '', source: '',
					}));
					rolls[id] = r;
				}
				if ( doc.system.effect.damage ) {
					const {damage} = doc.system.effect;
					const id = randomID(16);
					const r = { label: 'Dano', type: 'damage', terms: [] };
					r.terms = damage.split(/\+|-/g).map( t => ({
						expression: t.trim(), flavor: '', data: '', source: '',
					}));
					rolls[id] = r;
				}
			}
		} catch (error) {
			
		}
		const updateData = {};
		updateData['system.rolls'] = rolls;
		console.log(updateData);
		console.groupEnd();
		return updateData;
	}

	static itemRollsEmbedded(doc) {
		const itemTypes = ['weapon','armor','consumable','ability','spell'];
		const items = doc.items.filter( i => itemTypes.includes(i.type) );
		if ( !items ) return {};
		const itemUpdates = [];
		for (const item of items) {
			const update = SkyfallMigrationHelper.itemRolls(item);
			update['_id'] = item.id;
			update['id'] = item.id;
			itemUpdates.push(update);
		}
		const updateData = {};
		updateData['items'] = itemUpdates;
		return updateData;
	}

	/* -------------------------------------------------- */
	/* Version 0.9.700                                    */
	/* -------------------------------------------------- */

	async ddd() {
		pack = game.packs.get('skyfall-core.enemies');
		await pack.getDocuments();
		for (let npc of pack.contents) {
			for (let item of npc.items) {
				if ( item.type != 'ability' ) continue;
				rolls = Object.entries(item.system.rolls);
				for (let [id, r] of rolls) {
						if ( r.type != 'attack') continue;
						let terms = [r.terms[0], {
								"expression": "@proficiency",
								"flavor": "",
								"data": "",
								"source": ""
						}];
						k = `system.rolls.${id}.terms`;
						await item.update({
								[k]: terms,
						})
				}
			}
		}
		// prototypeToken.ring.enabled
	}
}

