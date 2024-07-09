
export const actions = [];
const commomActions = ["aid", "run", "disengage", "hide", "dodge", "prepare", "first-aid", "other", "bonus-action"];
for (const action of commomActions) {
	const actionKey = action.replace("-"," ").titleCase().replace(" ","");
	actions.push(
		{
			id: action,
			label: `SKYFALL2.ACTION.${actionKey}`,
			name: `SKYFALL2.ACTION.${actionKey}`,
			hint: `SKYFALL2.ACTION.${actionKey}Hint`,
			system: {action: "action"},
			type: "commom",
			action: "A"
		}
	);
}
const commomBonusActions = ["drink-potion","standup-laydown","search"];
for (const action of commomBonusActions) {
	const actionKey = action.replace("-"," ").titleCase().replace(" ","");
	actions.push(
		{
			id: action,
			label: `SKYFALL2.ACTION.${actionKey}`,
			name: `SKYFALL2.ACTION.${actionKey}`,
			hint: `SKYFALL2.ACTION.${actionKey}Hint`,
			system: {action: "bonus"},
			type: "commom",
			action: "B"
		}
	);
}

const commomReactions = ["opportunity-attack","delay"];
for (const action of commomReactions) {
	const actionKey = action.replace("-"," ").titleCase().replace(" ","");
	actions.push(
		{
			id: action,
			label: `SKYFALL2.ACTION.${actionKey}`,
			name: `SKYFALL2.ACTION.${actionKey}`,
			hint: `SKYFALL2.ACTION.${actionKey}Hint`,
			system: {action: "reaction"},
			type: "commom",
			action: "R"
		}
	);
}