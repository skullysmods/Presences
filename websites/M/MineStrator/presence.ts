const presence = new Presence({
		clientId: "1231279893053050880",
	}),
	browsingTimestamp = Math.floor(Date.now() / 1000);

const enum Assets { // Other default assets can be found at index.d.ts
	Logo = "https://i.imgur.com/Bog8yIL.png",
}

presence.on("UpdateData", async () => {
	const presenceData: PresenceData = {
		details: "Unknow Page",
		largeImageKey: Assets.Logo,
		startTimestamp: browsingTimestamp,
	};

	if (document.location.pathname === "/")
		presenceData.details = "Viewing home page";
	else if (document.location.pathname.includes("/connexion"))
		presenceData.details = "Viewing the login/sign-up page";
	else if (document.location.pathname.includes("/qui/sommes/nous"))
		presenceData.details = "Viewing the 'Who we are' page";
	else if (document.location.pathname.includes("/manifeste/2024"))
		presenceData.details = "Viewing the 2024 manifest page";
	else if (document.location.pathname.includes("/nos/partenaires"))
		presenceData.details = "Viewing the partners page";
	else if (document.location.pathname.includes("/foire/aux/questions"))
		presenceData.details = "Viewing the FAQ page";
	else if (document.location.pathname.includes("/nos/actualites"))
		presenceData.details = "Viewing the news page";
	else if (document.location.pathname.includes("/boite/a/idees"))
		presenceData.details = "Viewing the ideas box page";
	else if (document.location.pathname.includes("/changelogs"))
		presenceData.details = "Viewing the changelogs page";
	else if (document.location.pathname.includes("/boutique"))
		presenceData.details = "Viewing the goodies store page";
	else if (document.location.pathname.includes("/contactez/nous"))
		presenceData.details = "Viewing the contact us page";
	else if (document.location.pathname.includes("/nos/mybox"))
		presenceData.details = "Viewing the MyBox offers page";
	else if (document.location.pathname.includes("/nos/versions"))
		presenceData.details = "Viewing the pre-installed version page";
	else if (document.location.pathname.includes("/taches/en/cours"))
		presenceData.details = "Viewing the services status page";
	else if (document.location.pathname.includes("/roue/de/la/fortune"))
		presenceData.details = "Viewing the fortune wheel page";
	else if (document.location.pathname.includes("/guide/achat"))
		presenceData.details = "Viewing the shopping guide page";
	else if (document.location.pathname.includes("/essai/gratuit/serveur/minecraft"))
		presenceData.details = "Viewing the free servers trial page";
	else if (document.location.pathname.includes("/serveur/minecraft/gratuit"))
		presenceData.details = "Viewing the free servers for life page";
	else if (document.location.pathname.includes("/avis/client"))
		presenceData.details = "Viewing reviews page";
	else if (document.location.pathname.includes("/panel"))
		presenceData.details = "Viewing the panel";
	presence.setActivity(presenceData);
});
