package com.healthcare.i18n.utility.helpers;

import com.healthcare.i18n.entity.Language;
import com.healthcare.i18n.entity.LocalizedResource;
import com.healthcare.i18n.entity.Translation;
import com.healthcare.i18n.model.TranslationRequest;
import com.healthcare.i18n.utility.constants.TranslationConstants;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

public class LocalizedResourceGenerator {
    private static volatile long translatorRetryAt = 0;


    public static List<Translation> generateTranslations(LocalizedResource resource, String alternative, List<Language> languages) {

        List<Translation> translations = new ArrayList<>();

        for (Language language : languages) {
            // The translator is the only online dependency: once it fails, skip it for a minute so a
            // page full of untranslated strings does not wait on a network timeout for every one.
            if (System.currentTimeMillis() < translatorRetryAt) break;
            String toLanguage = language.getLanguageCode();
            String result;
            try {
                result = WebClient.create()
                        .post()
                        .uri(TranslationConstants.TRANSLATION_API_BASE_URL)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .body(Mono.just(new TranslationRequest("en", toLanguage, alternative)), TranslationRequest.class)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block(java.time.Duration.ofSeconds(12));
            } catch (Exception e) {
                translatorRetryAt = System.currentTimeMillis() + 60_000;
                break;
            }
            if (result == null) continue;
            Translation translation = new Translation();
            translation.setLocalizedText(result);
            translation.setLanguageCode(language.getLanguageCode());
            translation.setLanguageName(language.getLanguageName());
            translation.setParentResource(resource);
            translations.add(translation);
        }
        return translations;
    }
}
