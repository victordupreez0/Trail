import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { PartyAlert } from '../lib/party';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function AlertStrip({ alerts }: { alerts: PartyAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <View style={styles.alerts} accessibilityLiveRegion="polite">
      {alerts.map((a) => {
        const danger = a.severity === 'danger';
        const iconTint = danger ? colors.danger : colors.accent;
        const textTint = danger ? colors.dangerText : colors.accentText;
        return (
          <View
            key={a.key}
            accessibilityRole="alert"
            style={[styles.alert, danger ? styles.alertDanger : styles.alertWarning]}
          >
            <Ionicons
              name={danger ? 'battery-dead-outline' : 'time-outline'}
              size={16}
              color={iconTint}
            />
            <Text style={[styles.alertText, { color: textTint }]}>{a.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  alerts: { gap: spacing.xs },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.md,
  },
  alertDanger: { backgroundColor: colors.dangerSoft },
  alertWarning: { backgroundColor: colors.accentSoft },
  alertText: { ...typography.caption, flex: 1 },
});
