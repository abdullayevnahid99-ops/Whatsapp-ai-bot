// ... (kodun əvvəlki hissəsi)

client.on("message_create", async (message) => {
    console.log("message_create:", message.from, "->", message.to, "fromMe:", message.fromMe, "body:", message.body.substring(0, 50));
    if (message.fromMe) return;
    if (message.isStatus) return;
    if (message.from.includes("@g.us")) return;
    if (message.from.includes("@broadcast")) return;

    console.log("Processing message from:", message.from, "body:", message.body);
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                { role: "system", content: "Sən köməkçi bir botsan və yalnız Azərbaycan dilində cavab verməlisən." }, // Yeni əlavə olunan sətir
                { role: "user", content: message.body }
            ],
        });
        const response = completion.choices[0].message.content;
        await message.reply(response);
        console.log("Reply sent successfully to:", message.from);
    } catch (error) {
        console.error("OpenAI Error:", error.message);
        // Aşağıdakı sətri dəyişdirin:
        await message.reply("Bağışlayın, sorğunuzu emal edə bilmədim. Zəhmət olmasa, daha sonra yenidən cəhd edin."); // Azərbaycanca xəta mesajı
    }
});

// ... (kodun qalan hissəsi)
